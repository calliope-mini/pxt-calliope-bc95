// run on your server server: nc -vv -ul -p 9090
input.onGesture(Gesture.Shake, () => {
    bc95.send(
        "{\"accel\":" + input.acceleration(Dimension.Strength) + "}"
    )
})
input.onButtonPressed(Button.A, () => {
    bc95.send(
        "{\"temp\":" + input.temperature() + "}"
    )
})
modem.enableDebug(true)
bc95.init(
    SerialPin.C17,
    SerialPin.C16,
    BaudRate.BaudRate9600
)
bc95.attach(
    6
)
bc95.setServer("46.23.86.61", 9090)
bc95.send(
    "{\"temp\":" + input.temperature() + "}"
)
