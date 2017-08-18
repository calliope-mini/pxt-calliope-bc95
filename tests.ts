// this test runs on the device, connect and it will send the output on serial
// after everything is done

//% shim=pxtrt::panic
function panic(code2: number): void {
}

function assert(cond: boolean, msg_: string) {
    if (!cond) {
        bc95.log("ASSERT:", msg_);
        panic(45);
    }
}

bc95.init(SerialPin.C17, SerialPin.C16, BaudRate.BaudRate9600);
bc95.setReceiveBufferSize(100);

let responses: Array<string> = [];

bc95.sendAT("+CGMI");
bc95.sendAT("+CGMM");


basic.pause(100);
assert(bc95.expectOK("+CFUN=1"),
    "CFUN=1 failed");
assert(bc95.sendAT("+CIMI")[0] == "901405800006425",
    "query IMSI failed");
assert(bc95.sendAT("+NBAND?")[0] == "+NBAND:8",
    "NBAND failed");

assert(bc95.expectOK("+NCONFIG=AUTOCONNECT,TRUE"),
    "failed to set autoconnect");

// sends a URC if we have a connection status
assert(bc95.expectOK("+CEREG=1"),
    "+CEREG=1 failed");

assert(bc95.expectOK("+CSCON=1"),
    "+CSCON=1 failed");

assert(bc95.expectOK("+CGATT=1"),
    "+CGATT=1 failed");

bc95.pushAT("+CSQ");
bc95.pushAT("+NUESTATS");

while(true) {
    let response = bc95.sendAT("+CEREG?");
    if (response[0].compare("+CEREG:1,1") == 0) break;
}

assert(bc95.expectOK("+CGDCONT=1,\"IP\",\"internet.nbiot.telekom.de\""),
    "set APN failed");


for (let i = 0; i < 6; i++) {
    basic.showNumber(i);
    let response = bc95.sendAT("+CGATT?");
    responses.push(response[0]);
    if (response[0].compare("+CGATT:1") == 0) break;
    basic.pause(5000);
}

bc95.resetSerial();
console.log("TEST FINISHED OK");