#include "pxt.h"

namespace bc95 {
    //%
    void setReceiveBufferSize(int size) {
      uBit.serial.setRxBufferSize(size);
    }

    //%
    void resetSerial() {
      uBit.serial.redirect(USBTX, USBRX);
      uBit.serial.baud(MICROBIT_SERIAL_DEFAULT_BAUD_RATE);
    }

    //%
    StringData *getSerialNumber() {
      char tmp[9];
      snprintf(tmp, 9, "%8lx", microbit_serial_number());
      return ManagedString(tmp).leakData();
    }
}
