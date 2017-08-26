// run on your server server: nc -vv -ul -p 9090

input.onGesture(Gesture.Shake, () => {
    bc95.sendNumber(
        "accel",
        input.acceleration(Dimension.Strength)
    )
})
input.onButtonPressed(Button.A, () => {
    bc95.sendNumber(
        "temp",
        input.temperature()
    )
})
modem.enableDebug(true)
bc95.setEncryption(true)
bc95.init(
    SerialPin.C17,
    SerialPin.C16,
    BaudRate.BaudRate9600
)
bc95.attach()
bc95.setServer("46.23.86.61", 9090)
bc95.sendNumber(
    "temp",
    input.temperature()
)
