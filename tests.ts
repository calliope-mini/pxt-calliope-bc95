// this test runs on the device, connect and it will send the output on serial
// after everything is done
// run pxt test & copy build/binary.hex to MINI drive
namespace test_BC95 {
    let SERVER = "13.93.47.253";
    let PORT = 9090;

    // loop until button A is kept pressed
    const LOOP = false;
    // log AT commands to USB console
    const DEBUG_AT = false;

    //% shim=pxtrt::panic
    function panic(code2: number): void {
    }

    function assert(msg: string, cond: boolean) {
        if (!cond) {
            modem.log("ASSERT:", msg + " failed");
            panic(45);
        } else {
            modem.log("TEST:", msg + ": OK");
        }
    }

    console.log("TEST START");

    // test modem functionality
    modem.enableDebug(DEBUG_AT);

    // initialize module
    bc95.init(SerialPin.C17, SerialPin.C16, BaudRate.BaudRate9600);

    modem.log("!!!! ", "BC95/AT TEST");

    assert("modem working",
        modem.expectOK(""));
    assert("enable all functionality",
        modem.expectOK("+CFUN=1"));
    assert("check IMSI",
        modem.sendAT("+CIMI")[0] == "901405800006425");
    assert("connect to network",
        modem.expectOK("+COPS=1,2,\"26201\""));
    // try to wait for attachment max. approx. 30s
    for (let i = 0; i < 6; i++) {
        let response = modem.sendAT("+CGATT?");
        if (response[0] == "+CGATT:1") break;
        basic.pause(5000);
    }

    assert("check signal quality",
        modem.sendAT("+CSQ")[0] != "+CSQ:99,99");
    assert("check network stats",
        modem.expectOK("+NUESTATS"));

    // assert("set APN",
    //     bc95.expectOK("+CGDCONT=1,\"IP\",\"internet.nbiot.telekom.de\""));
    assert("check PDP context",
        modem.sendAT("+CGDCONT?")[0] == "+CGDCONT:0,\"IP\",\"internet.nbiot.telekom.de.MNC040.MCC901.GPRS\",,0,0");
    assert("check address",
        modem.sendAT("+CGPADDR")[0].substr(0, 9) == "+CGPADDR:");
    assert("check band",
        modem.sendAT("+NBAND?")[0] == "+NBAND:8");
    assert("ping external server",
        modem.expectOK("+NPING=85.214.66.173"));
    assert("expect ping reply", modem.receiveResponse((line: string) => {
        return line.length > 7 && line.substr(0, 7) == "+NPING:";
    })[0].length != 0);

    modem.log("!!!! ", "BC95 TEST");

    // test BC95 module functionality
    bc95.setServer(SERVER, PORT);

    // loop to send some values every 10 minutes
    do {
        bc95.send("{\"temp\":" + input.temperature() + "}");
        assert("sending number (temp)", bc95.sendOk());
        bc95.send("{\"light\":" + input.lightLevel() + "}");
        assert("sending number (light)", bc95.sendOk());
        bc95.send("{\"test\":\"" + "value " + input.temperature() + "\"}");
        assert("sending string", bc95.sendOk());
        for (let i = 0; LOOP && !input.buttonIsPressed(Button.A) && i < 600; i++) {
            basic.pause(1000);
        }
    } while (LOOP && !input.buttonIsPressed(Button.A));

    serial.resetSerial();
    console.log("TEST FINISHED OK");
}