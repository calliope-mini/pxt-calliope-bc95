/**
 * Functions for the NB-IoT module BC95.
 */

//% weight=2 color=#117447 icon="\uf1d9" block="BC95"
//% parts="bc95"
namespace bc95 {
    let SERVER: string = null;
    let PORT = 9090;
    let APN = "internet.nbiot.telekom.de";
    let USER = "";
    let PASS = "";
    let ERROR = false;

    /**
     * Initialize BC95 module. The serial port and generic settings.
     * @param tx the new transmission pins, eg: SerialPin.C17
     * @param rx the new reception pin, eg: SerialPin.C16
     * @param rate the new baud rate, eg: BaudRate.BaudRate9600
     */
    //% weight=100
    //% blockId=bc95_init block="initialize BC95|TX %tx|RX %rx|at baud rate %rate"
    //% blockExternalInputs=1
    //% parts="bc95"
    export function init(tx: SerialPin, rx: SerialPin, rate: BaudRate): void {
        modem.init(tx, rx, rate);
        // the BC95 requires at least an \r before AT
        modem.setATPrefix("\rAT");

        // check firmware version, could not get this to work with any other
        let r = modem.sendAT("+CGMR");
        if (!(r.length > 1 && r[r.length - 2] == "V100R100C10B656")) {
            if(r.length > 1) basic.showString("BC95 wrong firmware: " + r[r.length - 2]);
        }
        // setup some basics
        modem.expectOK("+NCONFIG=AUTOCONNECT,TRUE");
        modem.expectOK("+NCONFIG=CR_0354_0338_SCRAMBLING,TRUE");
        modem.expectOK("+NCONFIG=CR_0859_SI_AVOID,TRUE");
    }

    /**
     * Attach to the mobile network. May take up to 30s.
     * Waits for 1s between checks.
     * @param tries the number of tries to wait for connection, eg: 6
     */
    //% weight=90
    //% blockId=bc95_attach block="attach NB-IoT network|wait seconds %tries"
    //% blockExternalInputs=1
    //% parts="bc95"
    export function attach(tries: number = 6): void {
        modem.expectOK("+CFUN=1");
        if (modem.expectOK("+COPS=1,2,\"26201\"")) {
            for (let i = 0; i < tries; i++) {
                if (modem.sendAT("+CGATT?")[0] == "+CGATT:1") break;
                basic.pause(1000);
            }
        }
    }

    /**
     * Configure the server to use for the NB-IoT messaging.
     * @param host the IP address of a server to send messages to
     * @param port the port to send messages to, eg: 9090
     */
    //% weight=80
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
    //% weight=70
    //% blockId=bc95_setapn block="set APN %apn|user %user|password %password"
    //% blockExternalInputs=1
    //% parts="bc95"
    export function setAPN(apn: string, user: string = null, password: string = null) {
        APN = apn;
        if (user != null && user.length > 0) USER = user;
        if (password != null && password.length > 0) PASS = password;
    }

    /**
     * Send the actual message via UDP.
     * @param message the message to send
     * @param receivePort the local port to receive a response
     */
    //% weight=60
    //% blockId=bc95_send block="send raw message|message %message"
    //% blockExternalInputs=1
    //% advanced=true
    //% parts="bc95"
    export function send(message: string, receivePort: number = 44567): void {
        ERROR = true;
        if (SERVER != null && SERVER.length > 0) {
            // open the socket and remember the socket number
            let response = modem.sendAT("+NSOCR=DGRAM,17," + receivePort + ",1");
            if (response[response.length - 1] == "OK") {
                let socket = response[0];
                // send UDP packet
                ERROR = !modem.expectOK("+NSOST=" + socket + "," + SERVER + "," + PORT + ","
                    + (message.length) + "," + stringToHex(message));
                // close socket
                modem.expectOK("+NSOCL=" + socket);
            }
        }
    }

    /**
     * Check if the last send operation was successful.
     * Also reset the status.
     */
    //% weight=70
    //% blockId=bc95_sendOk block="send success?"
    //% parts="bc95"
    export function sendOk(): boolean {
        if (ERROR) {
            ERROR = false;
            return false;
        } else return true;
    }

    // converts a number into a readable hex-string representation
    export function numberToHex(n: number): string {
        return stringToHex(numberToString(n));
    }

    // converts a number into a binary string representation
    export function numberToString(n: number): string {
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
}