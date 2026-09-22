// Arrow keys drive MiP. A plays a sound and turns the chest green. B stops.
mip.connect()
mip.showRobot(true)
mip.driveWithArrows(true)

controller.A.onEvent(ControllerButtonEvent.Pressed, function () {
    mip.setChestColor(MipColor.Green)
    mip.playSound(MipSound.Yeah)
})

controller.B.onEvent(ControllerButtonEvent.Pressed, function () {
    mip.stop()
    mip.playSound(MipSound.Oops)
})
