/**
 * Functions for the NB-IoT module BC95.
 */

//% weight=2 color=#117447 icon="\uf1d9"
//% parts="bc95    
namespace bc95 {
    // enabling DEBUG allows to follow the AT flow on the USB serial port
    // this switches the serial back and forth and introduces delays
    let DEBUG = false;

    let TX = SerialPin.C17;
    let RX = SerialPin.C16;
    let BAUD = BaudRate.BaudRate9600;

    let SERVER = "";
    let PORT = 44567;
    let APN = "internet.nbiot.telekom.de";
    let USER = "";
    let PASS = "";
    let ENCRYPTED = false;
    let ERROR = false;

    /**
     * Initialize BC95 module. The serial port and generic settings.
     * @param tx the new transmission pins, eg: SerialPin.C17
     * @param rx the new reception pin, eg: SerialPin.C16
     * @param rate the new baud rate, eg: BaudRate.BaudRate9600
     */
    //% weight=210
    //% blockId=bc95_init block="initialize BC95|TX %tx|RX %rx|at baud rate %rate"
    //% blockExternalInputs=1
    //% parts="bc95"
    export function init(tx: SerialPin, rx: SerialPin, rate: BaudRate): void {
        // initialize serial port
        TX = tx;
        RX = rx;
        BAUD = rate;
        serial.redirect(TX, RX, BAUD);
        serial.setReceiveBufferSize(100);
    }

    /**
     * Attach to the mobile network. May take up to 30s.
     */
    //% weight=209
    //% blockId=bc95_attach block="attach NB-IoT network"
    //% parts="bc95"
    export function attach(): void {
        expectOK("+CFUN=1");
        expectOK("+COPS=1,2,\"26201\"");
        for (let i = 0; i < 6; i++) {
            if (bc95.sendAT("+CGATT?")[0] == "+CGATT:1") break;
            basic.pause(1000);
        }
    }

    /**
     * Configure the UDP server to use for the NB-IoT messaging.
     * @param host the IP address of a server to send messages to
     * @param port the port to send messages to, eg: 5883
     */
    //% weight=208
    //% blockId=bc95_setserver block="set server |address %host|port %port"
    //% parts="bc95"
    export function setServer(host: string, port: number): void {
        SERVER = host;
        PORT = port;
    }

    /**
     * Configure the APN to use for the NB-IoT messaging.
     * @param apn the access point name, eg: internet.nbiot.telekom.de
     * @param user a user name to access the APN
     * @param password a password to access the APN
     */
    //% weight=110
    //% blockId=bc95_setapn block="set APN %apn|user %user|password %password"
    //% blockExternalInputs=1
    //% parts="bc95"
    export function setAPN(apn: string, user: string = null, password: string = null) {
        APN = apn;
        if (user != null && user.length > 0) USER = user;
        if (password != null && password.length > 0) PASS = password;
    }

    /**
     * Set encryption mode. Whether data should be AES encrypted. See #showDeviceInfo
     * how to identify the device ID and secret.
     * ATTENTION: Only works if BLUETOOTH is enabled!
     * @param encrypted whether the data should be encrypted, eg: false
     */
    //% weight=105
    //% blockId=bc95_setapn block="encrypt messages %encrypted"
    //% parts="bc95"
    export function setEncryption(encrypted: boolean = false) {
        ENCRYPTED = encrypted;
    }


    /**
     * Send an AT command to the bc95 module. Just provide the actual
     * command, not the AT prefix, like this AT("+CGMI?"). Ignores the
     * AT command response completely
     * @param command the command to be sent without AT prefix
     */
    //% weight=20
    //% blockId=bc95_pushat block="send AT %command"
    //% parts="bc95"
    //% advanced=true
    export function pushAT(command: string): void {
        sendAT(command);
    }

    /**
     * Send an AT command to the bc95 module. Just provide the actual
     * command, not the AT prefix, like this AT("+CIMI"). Returns the
     * first line of the response from this AT command.
     * @param command the command to be sent without AT prefix
     */
    //% weight=22
    //% blockId=bc95_sendat block="send AT %command and receive"
    //% parts="bc95"
    //% advanced=true
    export function expectAT(command: string): string {
        let r = sendAT(command);
        if (r.length == 0) return "";
        return r[0];
    }

    export function sendAT(command: string): Array<string> {
        basic.pause(100);
        if (DEBUG) log("+++", "AT" + command);
        serial.writeString("\r\nAT" + command + "\r\n");
        return receiveResponse((line: string) => {
            return line == "OK\r" || line == "ERROR\r";
        });
    }

    export function receiveResponse(cond: (line: string) => boolean): Array<string> {
        let line = "";
        let received: Array<string> = [];
        do {
            line = serial.readLine_();
            if (line.length > 1) received.push(line.substr(0, line.length - 1));
        } while (!cond(line));
        if (DEBUG) logArray("---", received);
        return received;
    }

    /**
     * Send an AT command to the bc95 module and expect OK. Just provide the actual
     * command, not the AT prefix, like this AT("+CGMI?"). This function
     * only returns whether the command was executed successful or not.
     * @param command the command to be sent without AT prefix
     */
    //% weight=21
    //% blockId=bc95_expectok block="check AT %command|response OK?"
    //% parts="bc95"
    //% advanced=true
    export function expectOK(command: string): boolean {
        let response = sendAT(command);
        return response[response.length - 1] == "OK";
    }

    /**
     * Send a number to the backend server.
     */
    //% weight=110
    //% blockId=bc95_sendNumber block="UDP|send number message|key %key|value %n"
    //% blockExternalInputs=1
    //% parts="bc95"
    export function sendNumber(key: string, value: number): void {
        ERROR = !sendUDP("{\"" + key + "\":" + value + "}");
    }

    /**
     * Send a string to the backend server.
     */
    //% weight=120
    //% blockId=bc95_sendString block="UDP|send string message|key %key|value %n"
    //% blockExternalInputs=1
    //% parts="bc95"
    export function sendString(key: string, value: string): void {
        ERROR = !sendUDP("{\"" + key + "\":\"" + value + "\"}");
    }

    /**
     * Send the actual message, encoded. Data is encoded in message pack format:
     * `INT[DeviceId]BYTES[Message]`. The maximum message size is 504 bytes.
     * If messages are encrypted, the key is 16 bytes: [SECRET,ID,SECRET,ID].
     */
    function sendUDP(message: string, receivePort: number = 44567): boolean {
        let sendok = false;
        // open the socket and remember the socket number
        let response = sendAT("+NSOCR=DGRAM,17," + receivePort + ",1");
        if (response[response.length - 1] == "OK") {
            let socket = response[0];
            let packetLength = 0;

            let encoded = "";
            if (message.length < 32) {
                // messages shorter than 32 bytes will have a single 0xA0 + length marker byte
                packetLength = message.length + 1;
                encoded = String.fromCharCode(0xA0 + message.length);
            } else if (message.length < 256) {
                // messages shorter than 255 bytes have two bytes as marker: 0xd9 and length
                packetLength = message.length + 2;
                encoded += String.fromCharCode(0xD9) + String.fromCharCode(message.length);
            } else if (message.length < 505) {
                // messages shorter than 255 bytes have two bytes as marker: 0xd9 and a two byte length
                packetLength = message.length + 3;
                encoded += String.fromCharCode(0xD9) + String.fromCharCode(message.length >> 8) + String.fromCharCode(message.length & 0xff);
            } else {
                // the BC95 module only supports a maximum payload of 512 bytes!
                return false;
            }
            // add actual message
            encoded += message;

            // encrypt message, if needed, padding w/ 0x80 and zeros
            if(ENCRYPTED) {
                encoded = encrypt(encoded + String.fromCharCode(0x80));
                packetLength = encoded.length;
            }

            // encode the package in messagepack format
            let header = String.fromCharCode(0xCE) + numberToString(getDeviceId(1));
            packetLength += 5;

            // send UDP packet
            sendok = expectOK("+NSOST=" + socket + "," + SERVER + "," + PORT + "," + (packetLength) + "," + stringToHex(header + encoded));
            // close socket
            expectOK("+NSOCL=" + socket);
        }
        return sendok;
    }

    /**
     * Check if the last send operation was successful.
     * Also reset the status.
     */
    //% weight=99
    //% blockId=bc95_sendOk block="UDP send success?"
    //% parts="bc95"
    export function sendOk(): boolean {
        if (ERROR) {
            ERROR = false;
            return false;
        } else return true;
    }

    /**
     * Show Calliope device id and the secret for communication.
     */
    //% weight=2
    //% blockId=bc95_showdeviceinfo block="show device Info|on display %onDisplay"
    //% parts="bc95"
    //% advanced=true
    export function showDeviceInfo(onDisplay: boolean = true): void {
        let deviceId = numberToHex(getDeviceId(1));
        let deviceSecret = numberToHex(getDeviceId(0));
        log("ID", deviceId);
        log("SECRET", deviceSecret);
        if (onDisplay) basic.showString("id:" + deviceId + " secret:" + deviceSecret);
    }

    // converts a number into a readable hex-string representation
    function numberToHex(n: number): string {
        return stringToHex(numberToString(n));
    }

    // converts a number into a binary string representation
    function numberToString(n: number): string {
        return String.fromCharCode((n >> 24) & 0xff) +
            String.fromCharCode((n >> 16) & 0xff) +
            String.fromCharCode((n >> 8) & 0xff) +
            String.fromCharCode(n & 0xff);
    }

    // helper function to convert a string into a hex representation usable by the bc95 module
    export function stringToHex(s: string): string {
        const l = "0123456789ABCDEF";
        let r = "";
        for (let i = 0; i < s.length; i++) {
            let c = s.charCodeAt(i);
            r = r + l.substr((c >> 4), 1) + l.substr((c & 0x0f), 1);
        }
        return r;
    }

    //% shim=bc95::getDeviceId
    export function getDeviceId(n: number): number {
        // dummy value for the simulator
        return 0;
    }

    //% shim=bc95::encrypt
    export function encrypt(data: string): string {
        // dummy return
        return "???";
    }

    // debug functions

    /**
     * Enable AT command debug.
     */
    //% weight=1
    //% blockId=bc95_setDEBUG block="enable DEBUG %debug"
    //% parts="bc95"
    //% advanced=true
    export function enableDebug(debug: boolean = false): void {
        DEBUG = debug;
    }

    export function log(prefix: string, message: string): void {
        basic.pause(100);
        serial.resetSerial();
        serial.writeLine(prefix + " " + message);
        basic.pause(100);
        serial.redirect(TX, RX, BAUD);
        basic.pause(100);
    }

    export function logArray(prefix: string, lines: Array<string>): void {
        basic.pause(100);
        serial.resetSerial();
        if (lines.length > 1) console.log(prefix + " (" + lines.length + " lines)");
        for (let i = 0; i < lines.length; i++) {
            serial.writeLine(prefix + " " + lines[i]);
        }
        basic.pause(100);
        serial.redirect(TX, RX, BAUD);
        basic.pause(100);
    }
}

namespace serial {
    /**
     * Set serial receive buffer size.
     */
    //% blockId=serial_buffersize block="serial receive buffer size %size"
    //% shim=serial::setReceiveBufferSize
    export function setReceiveBufferSize(size: number): void {
        return;
    }

    /**
     * Reset serial back to USBTX/USBRX.
     */
    //% blockId=serial_resetserial block="serial reset"
    //% shim=serial::resetSerial
    export function resetSerial(): void {
        return;
    }

    //% shim=serial::readLine_
    export function readLine_(): string {
        return "OK\r";
    }
}
