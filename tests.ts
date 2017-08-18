// this test runs on the device, connect and it will send the output on serial
// after everything is done

//% shim=pxtrt::panic
function panic(code2: number): void {
}

function assert(msg: string, cond: boolean) {
    if (!cond) {
        bc95.log("ASSERT:", msg + " failed");
        panic(45);
    }
}

bc95.init(SerialPin.C17, SerialPin.C16, BaudRate.BaudRate9600);


assert("modem working",
    bc95.expectOK(""));
assert("enable all functionality",
    bc95.expectOK("+CFUN=1"));
assert("check IMSI",
    bc95.sendAT("+CIMI")[0] == "901405800006425");
assert("connect to network",
    bc95.expectOK("+COPS=1,2,\"26201\""));
// try to wait for attachment max. approx. 30s
for (let i = 0; i < 6; i++) {
    let response = bc95.sendAT("+CGATT?");
    if (response[0] == "+CGATT:1") break;
    basic.pause(5000);
}

assert("check signal quality",
    bc95.sendAT("+CSQ")[0] != "+CSQ:99,99");
assert("check network stats",
    bc95.expectOK("+NUESTATS"));

// assert("set APN",
//     bc95.expectOK("+CGDCONT=1,\"IP\",\"internet.nbiot.telekom.de\""));
assert("check PDP context",
    bc95.sendAT("+CGDCONT?")[0] == "+CGDCONT:0,\"IP\",\"internet.nbiot.telekom.de.MNC040.MCC901.GPRS\",,0,0");
assert("check address",
    bc95.sendAT("+CGPADDR")[0].substr(0,9) == "+CGPADDR:");
assert("check band",
    bc95.sendAT("+NBAND?")[0] == "+NBAND:8");
assert("ping external server",
    bc95.expectOK("+NPING=85.214.66.173"));
assert("expect ping reply", bc95.receiveResponse((line: string) => {
    return line.length > 7 && line.substr(0,7) == "+NPING:";
})[0].length != 0);

bc95.sendNumber("test", 123);
bc95.sendString("test", "value 123");

bc95.resetSerial();
console.log("TEST FINISHED OK");
