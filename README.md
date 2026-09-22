# MiP for MakeCode Arcade

Drive a [WowWee MiP](https://wowwee.com/mip/) balancing robot from a MakeCode Arcade game.

The game sends MiP commands while it runs in the browser. A small bookmark on the MakeCode page holds the Bluetooth connection, because the Arcade simulator frame is not allowed to open the browser's Bluetooth device chooser.

MiP is a product of WowWee. This project is an unofficial extension.

## Blocks

Open [MakeCode Arcade](https://arcade.makecode.com/), create a project, choose **Extensions**, and paste the GitHub URL of this repository.

| Group | What you can do |
| --- | --- |
| Connection | Connect, disconnect, read the robot name, show a stand-in robot on screen |
| Drive | Arrow keys, timed drive, turns, distance moves, steering |
| Lights | Chest color and the four eye lights |
| Sound | Built-in sounds and volume 0–7 |
| Actions | Fall, get up, built-in games, gesture or radar mode |
| Sensors | Battery, posture, radar, distance travelled, tray tilt, claps |
| Events | Gesture, radar, shake, clap, posture |

A starting program is in `test.ts`: arrow keys drive, **A** plays a sound, **B** stops.

`connect to MiP` tells the bridge the game is listening. The connection line at the bottom of the simulator reads **MiP: add bookmark** until the bridge is running, then **MiP: click Connect**, then the robot's name.

## Connect the robot

Use Chrome or Edge on a computer, or Chrome on Android. Turn MiP on and leave it upright. It advertises a name like `Mip-14915`.

1. In the `connect` folder, run `python3 -m http.server` and open `http://127.0.0.1:8000/`.
2. Drag **MiP Connect** to the bookmarks bar.
3. Open your Arcade project and start the simulator.
4. Click the bookmark. A **MiP** card appears at the corner of the page.
5. Choose **Connect MiP** and pick the robot. Use **Other Bluetooth device** if the name filter does not list it.
6. Run the game. The simulator line should show the robot name, and the chest light turns green when the radio connects.

The same page can drive MiP without MakeCode: hold the pad buttons or the arrow keys, and use the color and sound controls.

## Driving notes

- Arrow-key driving and **steer for** send a fresh command about every 50 ms. MiP stops when those commands stop.
- **Turn** and **drive distance** wait for an estimate of the move so the next block starts afterward. The robot's own timing can be a little longer or shorter.
- **Manual** game mode is selected when the link comes up, so drive commands are accepted. A gesture or radar block switches MiP into that sensor mode.
- Clap events turn clap detection on. Shake events arrive on their own.
- **Sleep** powers down the Bluetooth radio. Use the switch on MiP's back to wake it.

## What runs where

The blocks run inside the Arcade simulator and on hardware as ordinary game code. Bluetooth itself runs in the browser bridge. Handheld Arcade boards do not include a Bluetooth radio, so a game downloaded to a Meowbit or similar device will not reach MiP.

Commands follow the public [MiP BLE protocol](https://github.com/WowWeeLabs/MiP-BLE-Protocol): write characteristic `ffe9` on service `ffe5`, notifications on `ffe4` of service `ffe0`.

## Supported targets

* for PXT/arcade
