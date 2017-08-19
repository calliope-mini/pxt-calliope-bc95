// run on your server server: nc -vv -ul -p 5883

input.onButtonPressed(Button.A, () => {
    bc95.sendString(
        "Hallo",
        "Calliope mini"
    )
    if (bc95.sendOk()) {
        basic.showIcon(IconNames.Yes)
    } else {
        basic.showIcon(IconNames.No)
    }
    basic.pause(1000)
    basic.clearScreen()
})
input.onButtonPressed(Button.B, () => {
    bc95.sendNumber(
        "t",
        input.temperature()
    )
    if (bc95.sendOk()) {
        basic.showIcon(IconNames.Yes)
    } else {
        basic.showIcon(IconNames.No)
    }
    basic.pause(1000)
    basic.clearScreen()
})
bc95.init(
    SerialPin.C17,
    SerialPin.C16,
    BaudRate.BaudRate9600
)
bc95.attach()
bc95.setServer("46.23.86.61", 5883)
