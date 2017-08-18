# Calliope mini BC95 NB-IoT module

This is a package for controlling an NB-IoT module to send messages from the Calliope mini.
It can be used by the [PXT Calliope mini editor](https://pxt.calliope.cc/). Should also work
with PXT for Micro:bit.

More information on the module can be found on the [Quectel website](http://www.quectel.com/product/bc95.htm).
It is used in conjunction with an [evaluation kit](http://www.quectel.com/product/gsmevb.htm).

The code may be used as a starting point for similar AT based systems.

## Testing

- Modify `tests.ts` to send packages to your own server.
- Execute a little server: `socat -vvv PIPE udp-recvfrom:44567,fork` (Linux, also echos the messages) 
- Compile the test `pxt test` and copy `built/binary.hex` to the Calliope mini. 

> You can follow the AT flow on the USB serial console.

The socat server should show something like this:

```
< 2017/08/18 21:03:15.581139  length=12 from=0 to=11
{"test":123}> 2017/08/18 21:03:15.581278  length=12 from=0 to=11
{"test":123}< 2017/08/18 21:03:18.788587  length=20 from=0 to=19
{"test":"value 123"}> 2017/08/18 21:03:18.788728  length=20 from=0 to=19
{"test":"value 123"}< 2017/08/18 21:06:26.298899  length=12 from=0 to=11
```



## Meta

- PXT/calliope
- PXT/microbit

Author: Matthias L. Jugel ([@thinkberg](https://twitter.com/thinkberg))

## License

MIT