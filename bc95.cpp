#include "pxt.h"

namespace bc95 {
    //%
    StringData *getSerialNumber() {
      char tmp[9];
      snprintf(tmp, 9, "%8lx", microbit_serial_number());
      return ManagedString(tmp).leakData();
    }
}

namespace serial {
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
    StringData *readLine_() {
      return uBit.serial.readUntil(ManagedString("\n")).leakData();
    }

}
