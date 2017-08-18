#include "pxt.h"

namespace bc95 {
   /**
    * Set receive buffer size. Be careful, not to make a too big buffer.
    * This setting influences the maximum line length you can read with
    * serial.readLine().
    */
    //% weight=10
    //% help=serial/setReceiveBufferSize
    //% blockId=serial_reset block="serial buffer size %size"
    void setReceiveBufferSize(int size) {
      uBit.serial.setRxBufferSize(size);
    }

   /**
    * Reset the serial instance to use the USBTX and USBRX at the default baud rate.
    */
    //% weight=10
    //% help=serial/reset
    //% blockId=serial_reset block="serial pin reset"
    void resetSerial() {
      uBit.serial.redirect(USBTX, USBRX);
      uBit.serial.baud(MICROBIT_SERIAL_DEFAULT_BAUD_RATE);
    }
}
