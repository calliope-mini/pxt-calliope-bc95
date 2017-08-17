// this test runs on the device, connect and it will send the output on serial
// after everything is done

console.log("START");

bc95.init(SerialPin.C17, SerialPin.C16, BaudRate.BaudRate9600);

let responses: Array<string> = [];

let r = bc95.sendAT("+CGMI");
for(let i = 0; i < r.length - 1; i++) responses.push(r[i]);

r = bc95.sendAT("+CGMM");
for(let i = 0; i < r.length - 1; i++) responses.push(r[i]);

if(bc95.expectOK("+CGMI=?")) responses.push("+CGMI=?: OK");
else responses.push("+CGMI=?: ERROR");

if(bc95.expectOK("+CFUN=1")) responses.push("+CFUN=1: OK");
else responses.push("+CFUN=1: ERROR");

if(bc95.expectOK("+CGDCONT=1,\"IP\",\"internet.nbiot.telekom.de\"")) responses.push("+CGDCONT: OK");
else responses.push("+CGDCONT: ERROR");

if(bc95.expectOK("+CEREG=1")) responses.push("+CEREG: OK");
else responses.push("+CEREG: ERROR");

if(bc95.expectOK("+CSCON=1")) responses.push("+CSCON: OK");
else responses.push("+CSCON: ERROR");

if(bc95.expectOK("+CGATT=1")) responses.push("+CGATT: OK");
else responses.push("+CGATT: ERROR");

responses.push(bc95.sendAT("+CIMI")[0]);

for(let i = 0; i < 6; i++) {
    basic.showNumber(i);
    let response = bc95.sendAT("+CGATT?");
    responses.push(response[0]);
    if(response[0].compare("+CGATT:1") == 0) break;
    basic.pause(5000);
}

r = bc95.sendAT("+NUESTATS");
responses.push("+NUESTATS:");
for(let i = 0; i < r.length; i++) responses.push(r[i]);

serial.reset();
console.log("CHECKS");

for(let i = 0; i < responses.length; i++)
    console.log(responses[i]);

console.log("DONE");
