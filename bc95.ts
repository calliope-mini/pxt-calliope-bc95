/**
 * Functions for the NB-IoT module BC95
 */

//% weight=2 color=#A8BCBC
//% advanced=true
namespace bc95 {
    let SERVER = "46.23.86.61";
    let PORT = 44567;
    let APN = "internet.nbiot.telekom.de";
    let USER = "internet";
    let PASS = "sim";
    let ERROR = false;

    /**
     * Initialize BC95 module to use serial port.
     * @param tx the new transmission pins, eg: SerialPin.C17
     * @param rx the new reception pin, eg: SerialPin.C16
     * @param rate the new baud rate, eg: BaudRate.BaudRate9600
     */
    //% weight=210
    //% blockId=bc95_init block="initialize BC95|TX %tx|RX %rx|at baud rate %rate"
    //% parts="bc95"
    export function init(tx: SerialPin, rx: SerialPin, rate: BaudRate): void {
        serial.redirect(tx, rx, rate);
    }

    /**
     * Configure the APN to use for the NB-IoT messaging.
     * @param apn the access point name, eg: internet.nbiot.telekom.de
     * @param user a user name to access the APN
     * @param password a password to access the APN
     */
    //% weight=209
    //% blockId=bc95_setapn block="set APN %apn|user %user|password %password"
    //% parts="bc95"
    export function setAPN(apn: string, user: string = null, password: string = null) {
        APN = apn;
        if (user != null && user.length > 0) USER = user;
        if (password != null && password.length > 0) PASS = password;
    }

    /**
     * Configure the UDP server to use for the NB-IoT messaging.
     * @param host the IP address of a server to send messages to
     * @param port the port to send messages to, eg: 5883
     */
    //% weight=208
    //% blockId=bc95_setserver block="set UDP IP |address %host|port %port"
    //% parts="bc95"
    export function setServer(host: string, port: number): void {
        SERVER = host;
        PORT = port;
    }

    /**
     * Send an AT command to the BC95 module. Just provide the actual
     * command, not the AT prefix, like this AT("+CGMI?"). Ignores the
     * AT command response completely
     * @param command the command to be sent without AT prefix
     */
    //% weight=20
    //% blockId=bc95_pushat block="send AT %command"
    //% parts="bc95"
    export function pushAT(command: string): void {
        sendAT(command);
    }

    /**
     * Send an AT command to the BC95 module. Just provide the actual
     * command, not the AT prefix, like this AT("+CIMI"). Returns the
     * first line of the response from this AT command.
     * @param command the command to be sent without AT prefix
     */
    //% weight=22
    //% blockId=bc95_sendat block="send AT %command and receive"
    //% parts="bc95"
    export function expectAT(command: string): string {
        let r = sendAT(command);
        if (r.length == 0) return "";
        return r[0];
    }

    export function sendAT(command: string): Array<string> {
        basic.pause(100);
        serial.writeString("\r\nAT" + command + "\r\n");
        let line = "";
        let received: Array<string> = [];
        do {
            line = serial.readLine();
            if (line.length > 1) received.push(line.substr(0, line.length - 1));
        } while (!(line.compare("ERROR\r") == 0 || line.compare("OK\r") == 0));
        return received;
    }

    /**
     * Send an AT command to the BC95 module and expect OK. Just provide the actual
     * command, not the AT prefix, like this AT("+CGMI?"). This function
     * only returns whether the command was executed successful or not.
     * @param command the command to be sent without AT prefix
     */
    //% weight=21
    //% blockId=bc95_expectok block="check AT %command|response OK?"
    //% parts="bc95"
    export function expectOK(command: string): boolean {
        let response = sendAT(command);
        return response[response.length - 1].compare("OK") == 0;
    }

    /**
     * Send a number to the backend server.
     */
    //% weight=110
    //% blockId=bc95_sendNumber block="UDP|send number message|key %key|value %n"
    //% parts="bc95"
    export function sendNumber(key: string, value: number): void {
        ERROR = !sendUDP("{\"" + key + "\":" + value + "}");
    }

    /**
     * Send a string to the backend server.
     */
    //% weight=120
    //% blockId=bc95_sendString block="UDP|send string message|key %key|value %n"
    //% parts="bc95"
    export function sendString(key: string, value: string): void {
        ERROR = !sendUDP("{\"" + key + "\":\"" + value + "\"}");
    }

    /**
     * Send the actual message, encoded.
     */
    function sendUDP(message: string): boolean {
        let sendok = false;
        // open the socket and remember the socket number
        let response = sendAT("+NSOCR,DGRAM,17,4587,0");
        if (response[response.length - 1].compare("OK") == 0) {
            let socket = response[0];
            // send UDP packet
            sendok = expectOK("+NSOST=" + socket + "," + SERVER + "," + PORT + "," + message.length + "," + stringToHex(message));
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
        if(ERROR) {
            ERROR = false;
            return false;
        } else return true;
    }

    const l = "0123456789ABCDEF";

    // helper function to convert a string into a hex representation usable by the BC95 module
    export function stringToHex(s: string): string {
        let r = "";
        for (let i = 0; i < s.length; i++) {
            let c = s.charCodeAt(i);
            r = r + l.substr((c >> 4), 1) + l.substr((c & 0x0f), 1);
        }
        return r;
    }

}
