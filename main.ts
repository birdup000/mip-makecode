// This project already includes the MiP blocks.
// Arrow keys drive. A turns the chest green and plays a sound. B stops.
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
