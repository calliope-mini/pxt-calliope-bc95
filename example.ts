bc95.init(SerialPin.C17, SerialPin.C16, BaudRate.BaudRate9600)
bc95.setServer("12.34.56.78", 5883)
bc95.sendString("Hello", "Calliope mini")
