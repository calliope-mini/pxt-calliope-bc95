// this test runs on the device, connect and it will send the output on serial
// after everything is done
// run pxt test & copy build/binary.hex to MINI drive

// test configuration

// loop until button A is kept pressed
import temperature = input.temperature;

const LOOP = true;
const DEBUG_AT = false;

//% shim=pxtrt::panic
function panic(code2: number): void {
}

function assert(msg: string, cond: boolean) {
    if (!cond) {
        bc95.log("ASSERT:", msg + " failed");
        panic(45);
    } else {
        bc95.log("TEST:", msg + ": OK");
    }
}

console.log("START TEST");

bc95.init(SerialPin.C17, SerialPin.C16, BaudRate.BaudRate9600);
bc95.enableDebug(DEBUG_AT);
bc95.showDeviceInfo(false);

let encryptionSupported = true;
let r = bc95.encrypt("ABCDEFG0123456");
if (r.length) {
    bc95.log("ENCRYPTED", bc95.stringToHex(r));
    assert("encryption", r.length > 0);
    assert("encryption cipher", bc95.stringToHex(r) == "8FF121A1CF04911C42EF80CCF13440A5");
} else {
    encryptionSupported = false;
    bc95.log("ENCRYPTION", "unsupported, enable BLE");
}

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
    bc95.sendAT("+CGPADDR")[0].substr(0, 9) == "+CGPADDR:");
assert("check band",
    bc95.sendAT("+NBAND?")[0] == "+NBAND:8");
assert("ping external server",
    bc95.expectOK("+NPING=85.214.66.173"));
assert("expect ping reply", bc95.receiveResponse((line: string) => {
    return line.length > 7 && line.substr(0, 7) == "+NPING:";
})[0].length != 0);

bc95.setServer("13.93.47.253", 9090);

// test encrypted
if (encryptionSupported) {
    bc95.setEncryption(true);
    bc95.sendNumber("test", 123);
    assert("sending number (encrypted)", bc95.sendOk());
    bc95.sendString("test", "value 123");
    assert("sending string (encrypted)", bc95.sendOk());
}

// loop to send some values every 10 minutes
do {
    // test unencrypted
    bc95.setEncryption(false);
    bc95.sendNumber("temp", input.temperature());
    assert("sending number (temp)", bc95.sendOk());
    bc95.sendNumber("light", input.lightLevel());
    assert("sending number (light)", bc95.sendOk());
    bc95.sendString("test", "value "+input.temperature());
    assert("sending string", bc95.sendOk());
    for (let i = 0; !input.buttonIsPressed(Button.A) && i < 600; i++) {
        basic.pause(1000);
    }
} while (LOOP && !input.buttonIsPressed(Button.A));

serial.resetSerial();
console.log("TEST FINISHED OK");
