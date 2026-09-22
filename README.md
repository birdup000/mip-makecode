# MiP for MakeCode Arcade

Drive a [WowWee MiP](https://wowwee.com/mip/) from a MakeCode Arcade game. MiP is a product of WowWee. This project is unofficial.

## Open the project

On the [MakeCode Arcade](https://arcade.makecode.com/) home screen:

1. Choose **Import**, then **Import URL**.
2. Paste the GitHub address of this repository.
3. Open the project.

The **MiP** category is already in the toolbox. The home screen does not have a separate "import extension" button. Importing this repository is the whole install.

The starter program uses the arrow keys to drive. **A** turns the chest green and plays a sound. **B** stops.

## Connect the robot

The simulator cannot open the Bluetooth chooser itself. A bookmark on the MakeCode page does that. Use Chrome or Edge. Turn MiP on and stand it upright. It shows up with a name like `Mip-14915`.

On Linux, Chrome ships with Web Bluetooth switched off, so `navigator.bluetooth` does not exist and no picker ever opens. Chrome must be started with `--enable-features=WebBluetooth`.

1. In the `connect` folder, run `./start.sh`. It serves the page and opens Chrome with Web Bluetooth enabled at `http://127.0.0.1:8000/`. (Or run `python3 -m http.server 8000` yourself and start Chrome with `google-chrome --enable-features=WebBluetooth http://127.0.0.1:8000/`.) Quit every other Chrome window first, otherwise the flag is ignored.
2. Drag **MiP Connect** onto the bookmarks bar.
3. Go back to the Arcade project and start the simulator.
4. Click the bookmark, then **Connect MiP**, and pick the robot.
5. The bottom of the simulator changes to the robot's name. The chest light turns green when the radio connects.

That same page can also drive MiP on its own, with the pad and the arrow keys.

## Blocks

| Group | What you can do |
| --- | --- |
| Connection | Connect, disconnect, read the robot name, show a stand-in robot |
| Drive | Arrow keys, timed drive, turns, distance moves, steering |
| Lights | Chest color and the four eye lights |
| Sound | Built-in sounds and volume 0–7 |
| Actions | Fall, get up, built-in games, gesture or radar mode |
| Sensors | Battery, posture, radar, distance travelled, tray tilt, claps |
| Events | Gesture, radar, shake, clap, posture |

Arrow-key driving keeps sending a command about every 50 ms, which is what MiP needs in order to keep rolling. **Sleep** turns the Bluetooth radio off. Wake the robot with the switch on its back.

Commands follow the public [MiP BLE protocol](https://github.com/WowWeeLabs/MiP-BLE-Protocol). A game downloaded to a handheld Arcade board stays on that board. The Bluetooth link is the browser bookmark while the simulator is running.

## Supported targets

* for PXT/arcade
