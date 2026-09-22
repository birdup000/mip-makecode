enum MipDirection {
    //% block="forward"
    Forward = 0,
    //% block="back"
    Back = 1
}

enum MipTurn {
    //% block="left"
    Left = 0,
    //% block="right"
    Right = 1
}

enum MipColor {
    //% block="off"
    Off = 0,
    //% block="red"
    Red = 1,
    //% block="green"
    Green = 2,
    //% block="blue"
    Blue = 3,
    //% block="yellow"
    Yellow = 4,
    //% block="purple"
    Purple = 5,
    //% block="white"
    White = 6,
    //% block="orange"
    Orange = 7,
    //% block="cyan"
    Cyan = 8
}

enum MipEye {
    //% block="off"
    Off = 0,
    //% block="on"
    On = 1,
    //% block="blink"
    Blink = 2,
    //% block="blink fast"
    BlinkFast = 3
}

enum MipLook {
    //% block="off"
    Off = 0,
    //% block="on"
    On = 1,
    //% block="blink"
    Blink = 2,
    //% block="blink fast"
    BlinkFast = 3,
    //% block="left"
    Left = 4,
    //% block="right"
    Right = 5
}

enum MipSound {
    //% block="beep"
    Beep = 1,
    //% block="burp"
    Burp = 2,
    //% block="hello"
    Hello = 35,
    //% block="yeah"
    Yeah = 80,
    //% block="oh yeah"
    OhYeah = 56,
    //% block="oops"
    Oops = 57,
    //% block="ouch"
    Ouch = 58,
    //% block="go"
    Go = 29,
    //% block="let's go"
    LetsGo = 30,
    //% block="laugh"
    Laugh = 34,
    //% block="trumpet"
    Trumpet = 73,
    //% block="bye"
    Bye = 19,
    //% block="happy"
    Happy = 93,
    //% block="sad"
    Sad = 97,
    //% block="angry"
    Angry = 85,
    //% block="stop sound"
    Stop = 105
}

enum MipFall {
    //% block="on its back"
    OnBack = 0,
    //% block="face down"
    FaceDown = 1
}

enum MipGetUp {
    //% block="from the front"
    Front = 0,
    //% block="from the back"
    Back = 1,
    //% block="from either side"
    Either = 2
}

enum MipGame {
    //% block="manual"
    Manual = 1,
    //% block="cage"
    Cage = 2,
    //% block="tracking"
    Tracking = 3,
    //% block="dance"
    Dance = 4,
    //% block="default"
    DefaultMode = 5,
    //% block="stack"
    Stack = 6,
    //% block="tricks"
    Tricks = 7,
    //% block="roam"
    Roam = 8
}

enum MipSensorMode {
    //% block="off"
    Off = 0,
    //% block="gesture"
    Gesture = 2,
    //% block="radar"
    Radar = 4
}

enum MipPosture {
    //% block="on its back"
    OnBack = 0,
    //% block="face down"
    FaceDown = 1,
    //% block="upright"
    Upright = 2,
    //% block="picked up"
    PickedUp = 3,
    //% block="handstand"
    Handstand = 4,
    //% block="face down on tray"
    FaceDownOnTray = 5,
    //% block="on back with stand"
    OnBackWithStand = 6,
    //% block="unknown"
    Unknown = 255
}

enum MipRadar {
    //% block="unknown"
    Unknown = 0,
    //% block="nothing ahead"
    Nothing = 1,
    //% block="10 to 30 cm"
    Near = 2,
    //% block="closer than 10 cm"
    Close = 3
}

enum MipGesture {
    //% block="unknown"
    Unknown = 0,
    //% block="left"
    Left = 0x0a,
    //% block="right"
    Right = 0x0b,
    //% block="sweep left"
    SweepLeft = 0x0c,
    //% block="sweep right"
    SweepRight = 0x0d,
    //% block="hold in front"
    Center = 0x0e,
    //% block="forward"
    Forward = 0x0f,
    //% block="back"
    Back = 0x10
}

/**
 * Drive a WowWee MiP from the MakeCode Arcade simulator.
 * The browser bridge in connect/ listens for these commands over Bluetooth.
 */
//% color="#E85D04" weight=80 icon="\uf544" block="MiP"
//% groups='["Connection", "Drive", "Lights", "Sound", "Actions", "Sensors", "Events"]'
namespace mip {
    const CHANNEL = "mip"
    const OP_HELLO = 0x01
    const OP_DISCONNECT = 0x02
    const OP_WRITE = 0x10
    const OP_STATUS = 0x80
    const OP_ERROR = 0x81
    const OP_NOTIFY = 0x90

    let booted = false
    let bridgeSeen = false
    let connected = false
    let errorCode = 0
    let deviceName = ""
    let firmware = ""
    let battery = 0
    let posture = MipPosture.Unknown
    let radar = MipRadar.Unknown
    let lastGestureValue = MipGesture.Unknown
    let lastClaps = 0
    let volumeLevel = 0
    let trayTilt = 0
    let odometerCm = 0
    let sensorChoice = 0
    let wantClap = false

    let gestureSrc = 0
    let radarSrc = 0
    let shakeSrc = 0
    let clapSrc = 0
    let postureSrc = 0

    let steerToken = 0
    let arrowsOn = false
    let arrowsWereDown = false
    let showStatusLine = true

    let chestR = 255
    let chestG = 110
    let chestB = 0
    let eye1 = MipEye.On
    let eye2 = MipEye.On
    let eye3 = MipEye.On
    let eye4 = MipEye.On

    let robotSprite: Sprite = null
    let previewKind = 0
    let simHeading = 0
    let simForward = 0
    let simTurnRate = 0
    let simUntil = 0
    let spinRemaining = 0

    function scaleSigned(percent: number, max: number): number {
        let p = percent
        if (p > 100) p = 100
        if (p < -100) p = -100
        return Math.round(p * max / 100)
    }

    function scalePositive(percent: number, max: number): number {
        let p = percent
        if (p > 100) p = 100
        if (p < 0) p = 0
        return Math.round(p * max / 100)
    }

    function send(bytes: number[]) {
        const framed: number[] = [OP_WRITE]
        for (let i = 0; i < bytes.length; i++) framed.push(bytes[i] & 0xff)
        control.simmessages.send(CHANNEL, Buffer.fromArray(framed), true)
    }

    function sendHello() {
        control.simmessages.send(CHANNEL, Buffer.fromArray([OP_HELLO]), true)
    }

    function sendBridgeDisconnect() {
        control.simmessages.send(CHANNEL, Buffer.fromArray([OP_DISCONNECT]), true)
    }

    function applyControlMode() {
        if (sensorChoice == MipSensorMode.Radar || sensorChoice == MipSensorMode.Gesture) {
            send(mipPackets.sensorMode(sensorChoice))
        } else {
            send(mipPackets.sensorMode(MipSensorMode.Off))
            send(mipPackets.gameMode(MipGame.Manual))
        }
        if (wantClap) send(mipPackets.enableClap(1))
    }

    function markConnected(now: boolean) {
        const rose = now && !connected
        connected = now
        if (now) errorCode = 0
        if (!rose) return
        applyControlMode()
        send(mipPackets.readVersion())
        send(mipPackets.readStatus())
    }

    function readAscii(msg: Buffer, start: number): string {
        let text = ""
        for (let i = start; i < msg.length; i++) {
            const code = msg.getUint8(i)
            if (code < 32 || code > 126) break
            text = text + String.fromCharCode(code)
            if (text.length >= 16) break
        }
        return text
    }

    function signedByte(value: number): number {
        if (value > 127) return value - 256
        return value
    }

    function batteryPercent(raw: number): number {
        let percent = Math.round((raw - 0x4d) * 100 / (0x7c - 0x4d))
        if (percent < 0) percent = 0
        if (percent > 100) percent = 100
        return percent
    }

    function postureFrom(value: number): MipPosture {
        if (value == MipPosture.OnBack) return MipPosture.OnBack
        if (value == MipPosture.FaceDown) return MipPosture.FaceDown
        if (value == MipPosture.Upright) return MipPosture.Upright
        if (value == MipPosture.PickedUp) return MipPosture.PickedUp
        if (value == MipPosture.Handstand) return MipPosture.Handstand
        if (value == MipPosture.FaceDownOnTray) return MipPosture.FaceDownOnTray
        if (value == MipPosture.OnBackWithStand) return MipPosture.OnBackWithStand
        return MipPosture.Unknown
    }

    function gestureFrom(value: number): MipGesture {
        if (value == MipGesture.Left) return MipGesture.Left
        if (value == MipGesture.Right) return MipGesture.Right
        if (value == MipGesture.SweepLeft) return MipGesture.SweepLeft
        if (value == MipGesture.SweepRight) return MipGesture.SweepRight
        if (value == MipGesture.Center) return MipGesture.Center
        if (value == MipGesture.Forward) return MipGesture.Forward
        if (value == MipGesture.Back) return MipGesture.Back
        return MipGesture.Unknown
    }

    function radarFrom(value: number): MipRadar {
        if (value == MipRadar.Nothing) return MipRadar.Nothing
        if (value == MipRadar.Near) return MipRadar.Near
        if (value == MipRadar.Close) return MipRadar.Close
        return MipRadar.Unknown
    }

    function handleRobot(msg: Buffer) {
        const len = msg.length - 1
        if (len < 1) return
        const cmd = msg.getUint8(1)
        const b1 = len > 1 ? msg.getUint8(2) : 0
        const b2 = len > 2 ? msg.getUint8(3) : 0
        const b3 = len > 3 ? msg.getUint8(4) : 0
        const b4 = len > 4 ? msg.getUint8(5) : 0
        if (cmd == 0x79 && len >= 3) {
            battery = batteryPercent(b1)
            const nextPosture = postureFrom(b2)
            if (nextPosture != MipPosture.Unknown && nextPosture != posture) {
                posture = nextPosture
                control.raiseEvent(postureSrc, posture)
            }
        } else if (cmd == 0x0a && len >= 2) {
            const gesture = gestureFrom(b1)
            if (gesture != MipGesture.Unknown) {
                lastGestureValue = gesture
                control.raiseEvent(gestureSrc, gesture)
            }
        } else if (cmd == 0x0c && len >= 2) {
            const zone = radarFrom(b1)
            if (zone != MipRadar.Unknown && zone != radar) {
                radar = zone
                control.raiseEvent(radarSrc, zone)
            }
        } else if (cmd == 0x1a) {
            control.raiseEvent(shakeSrc, 1)
        } else if (cmd == 0x1d && len >= 2) {
            lastClaps = b1
            control.raiseEvent(clapSrc, 1)
        } else if (cmd == 0x85 && len >= 5) {
            const raw = b1 * 16777216 + b2 * 65536 + b3 * 256 + b4
            odometerCm = Math.round(raw / 48.5)
        } else if (cmd == 0x16 && len >= 2) {
            volumeLevel = b1
        } else if (cmd == 0x81 && len >= 2) {
            trayTilt = signedByte(b1)
        } else if (cmd == 0x14 && len >= 5) {
            firmware = "" + b1 + "-" + b2 + "-" + b3 + "." + b4
        }
    }

    function onBridge(msg: Buffer) {
        if (!msg || msg.length < 1) return
        bridgeSeen = true
        const op = msg.getUint8(0)
        if (op == OP_STATUS) {
            deviceName = readAscii(msg, 2)
            markConnected(msg.length > 1 && msg.getUint8(1) == 1)
        } else if (op == OP_ERROR) {
            errorCode = msg.length > 1 ? msg.getUint8(1) : 0
            connected = false
        } else if (op == OP_NOTIFY) {
            handleRobot(msg)
        }
    }

    function statusLine(): string {
        if (!showStatusLine) return ""
        if (errorCode == 1) return "MiP: no Bluetooth"
        if (errorCode == 2) return "MiP: none picked"
        if (errorCode == 3) return "MiP: connect failed"
        if (errorCode == 4) return "MiP: disconnected"
        if (connected) {
            if (deviceName.length > 0) return "MiP: " + deviceName
            return "MiP: connected"
        }
        if (bridgeSeen) return "MiP: click Connect"
        return "MiP: add bookmark"
    }

    function paintStatus() {
        const line = statusLine()
        if (line.length == 0) return
        const y = screen.height - 10
        screen.fillRect(0, y, screen.width, 10, 15)
        screen.print(line, 2, y + 1, 1)
    }

    function eyeColor(mode: number): number {
        if (mode == MipEye.Off) return 15
        if (mode == MipEye.Blink) return 9
        if (mode == MipEye.BlinkFast) return 6
        return 5
    }

    function nearestPalette(r: number, g: number, b: number): number {
        if (r < 25 && g < 25 && b < 25) return 15
        if (r > 210 && g > 210 && b > 210) return 1
        if (r > 160 && g > 140 && b < 80) return 5
        if (r > g && r > b) return g > 90 ? 4 : 2
        if (g > r && g > b) return 7
        if (b > r && b > g) return g > 100 ? 9 : 8
        if (r > 140 && b > 140) return 10
        return 4
    }

    function paintEye(img: Image, x: number, mode: number) {
        img.fillRect(x, 7, 3, 3, eyeColor(mode))
    }

    function robotImage(): Image {
        const img = image.create(32, 32)
        img.fill(0)
        img.fillRect(6, 24, 8, 7, 15)
        img.fillRect(18, 24, 8, 7, 15)
        img.fillRect(5, 26, 4, 4, 1)
        img.fillRect(23, 26, 4, 4, 1)
        img.fillRect(7, 13, 18, 12, nearestPalette(chestR, chestG, chestB))
        img.fillRect(8, 2, 16, 12, 1)
        paintEye(img, 9, eye1)
        paintEye(img, 13, eye2)
        paintEye(img, 17, eye3)
        paintEye(img, 21, eye4)
        return img
    }

    function refreshRobot() {
        if (robotSprite) robotSprite.setImage(robotImage())
    }

    function previewKindId(): number {
        if (!previewKind) previewKind = SpriteKind.create()
        return previewKind
    }

    function previewMotion(forward: number, turnPerTick: number, ms: number) {
        simForward = forward
        simTurnRate = turnPerTick
        simUntil = control.millis() + ms
    }

    function previewSpin(degrees: number, ms: number) {
        spinRemaining += degrees
        if (simUntil < control.millis() + ms) simUntil = control.millis() + ms
    }

    function sendStopPacket() {
        simForward = 0
        simTurnRate = 0
        simUntil = 0
        spinRemaining = 0
        send(mipPackets.stop())
    }

    function pauseUnlessStopped(ms: number, token: number) {
        let left = ms
        while (left > 0 && token == steerToken) {
            const step = left > 50 ? 50 : left
            pause(step)
            left -= step
        }
    }

    function onTick() {
        if (arrowsOn) {
            let speed = 0
            let turn = 0
            if (controller.up.isPressed() && !controller.down.isPressed()) speed = 70
            else if (controller.down.isPressed() && !controller.up.isPressed()) speed = -70
            if (controller.right.isPressed() && !controller.left.isPressed()) turn = 55
            else if (controller.left.isPressed() && !controller.right.isPressed()) turn = -55
            if (speed != 0 || turn != 0) {
                const forward = scaleSigned(speed, 32)
                const spin = scaleSigned(turn, 32)
                send(mipPackets.continuousDrive(forward, spin))
                previewMotion(forward, spin * 0.45, 160)
                arrowsWereDown = true
            } else if (arrowsWereDown) {
                arrowsWereDown = false
                sendStopPacket()
            }
        }

        if (spinRemaining != 0) {
            let step = 10
            if (spinRemaining < 0) step = -10
            if (Math.abs(spinRemaining) < 10) step = spinRemaining
            simHeading += step
            spinRemaining -= step
        }
        if (control.millis() > simUntil) {
            simForward = 0
            simTurnRate = 0
        } else {
            simHeading += simTurnRate
        }
        while (simHeading >= 360) simHeading -= 360
        while (simHeading < 0) simHeading += 360
        if (robotSprite && simForward != 0) {
            const rad = simHeading * Math.PI / 180
            robotSprite.x += Math.sin(rad) * simForward / 14
            robotSprite.y -= Math.cos(rad) * simForward / 14
        }
    }

    function onPoll() {
        sendHello()
        if (!connected) return
        send(mipPackets.readStatus())
        send(mipPackets.readOdometer())
        send(mipPackets.readVolume())
        send(mipPackets.readWeight())
    }

    function boot() {
        if (booted) return
        booted = true
        gestureSrc = control.allocateEventSource()
        radarSrc = control.allocateEventSource()
        shakeSrc = control.allocateEventSource()
        clapSrc = control.allocateEventSource()
        postureSrc = control.allocateEventSource()
        control.simmessages.onReceived(CHANNEL, onBridge)
        game.onPaint(paintStatus)
        game.onUpdateInterval(50, onTick)
        game.onUpdateInterval(2000, onPoll)
    }

    /**
     * Ask the browser bridge for the robot link.
     * Click the MiP bookmark on the MakeCode page, then Connect, and pick your robot.
     */
    //% block="connect to MiP"
    //% group="Connection" weight=100
    //% blockId=mip_connect
    export function connect() {
        errorCode = 0
        sendHello()
    }

    /**
     * Drop the Bluetooth link to MiP.
     */
    //% block="disconnect from MiP"
    //% group="Connection" weight=90
    //% blockId=mip_disconnect
    export function disconnect() {
        steerToken++
        sendStopPacket()
        sendBridgeDisconnect()
        connected = false
        deviceName = ""
    }

    /**
     * True after the bridge has connected to a robot.
     */
    //% block="MiP is connected"
    //% group="Connection" weight=80
    //% blockId=mip_is_connected
    export function isConnected(): boolean {
        return connected
    }

    /**
     * Name advertised by the robot, such as Mip-14915.
     */
    //% block="MiP name"
    //% group="Connection" weight=70
    //% blockId=mip_device_name
    export function name(): string {
        return deviceName
    }

    /**
     * Draw a stand-in MiP on the Arcade screen while you try commands.
     */
    //% block="show on-screen MiP $on"
    //% on.shadow=toggleOnOff
    //% on.defl=true
    //% group="Connection" weight=60
    //% blockId=mip_show_robot
    export function showRobot(on: boolean) {
        if (!on) {
            if (robotSprite) robotSprite.destroy()
            robotSprite = null
            return
        }
        if (robotSprite) return
        robotSprite = sprites.create(robotImage(), previewKindId())
        robotSprite.x = 80
        robotSprite.y = 60
        robotSprite.z = 100
        robotSprite.setFlag(SpriteFlag.Ghost, true)
        robotSprite.setFlag(SpriteFlag.RelativeToCamera, true)
        robotSprite.setFlag(SpriteFlag.StayInScreen, true)
    }

    /**
     * Show or hide the connection line at the bottom of the screen.
     */
    //% block="show MiP connection line $on"
    //% on.shadow=toggleOnOff
    //% on.defl=true
    //% group="Connection" weight=50
    //% blockId=mip_show_status
    export function showStatus(on: boolean) {
        showStatusLine = on
    }

    /**
     * Drive forward or back at a speed from 0 to 100 percent.
     * The block waits until the drive time is over.
     */
    //% block="drive $direction at $speed percent for $ms ms"
    //% speed.min=0 speed.max=100 speed.defl=50
    //% ms.shadow=timePicker ms.defl=500
    //% direction.defl=MipDirection.Forward
    //% group="Drive" weight=90
    //% blockId=mip_drive
    export function drive(direction: MipDirection, speed: number, ms: number) {
        steerToken++
        const token = steerToken
        const raw = scalePositive(speed, 30)
        const signed = direction == MipDirection.Back ? -raw : raw
        let remaining = ms
        if (remaining < 0) remaining = 0
        previewMotion(signed, 0, remaining)
        while (remaining > 0 && token == steerToken) {
            const slice = remaining > 1700 ? 1700 : remaining
            send(mipPackets.driveTimed(direction == MipDirection.Back ? 1 : 0, raw, slice))
            pauseUnlessStopped(slice, token)
            remaining -= slice
        }
    }

    /**
     * Turn in place. Speed is 0 to 100 percent.
     * The block waits for an estimate of the turn time.
     */
    //% block="turn $direction $degrees degrees at $speed percent"
    //% degrees.min=0 degrees.max=360 degrees.defl=90
    //% speed.min=0 speed.max=100 speed.defl=50
    //% direction.defl=MipTurn.Right
    //% group="Drive" weight=80
    //% blockId=mip_turn
    export function turn(direction: MipTurn, degrees: number, speed: number) {
        steerToken++
        const token = steerToken
        let protocolSpeed = scalePositive(speed, 24)
        if (protocolSpeed < 1 && degrees > 0) protocolSpeed = 1
        const right = direction == MipTurn.Right ? 1 : 0
        send(mipPackets.turnAngle(right, degrees, protocolSpeed))
        const signed = right ? degrees : -degrees
        let wait = Math.round(degrees / 360 * 520 * (24 / protocolSpeed)) + 160
        if (wait < 160) wait = 160
        if (wait > 8000) wait = 8000
        previewSpin(signed, wait)
        pauseUnlessStopped(wait, token)
    }

    /**
     * Queue a drive of up to 255 cm and a turn of up to 360 degrees.
     * MiP chooses the speed. The block waits for an estimate of the move.
     */
    //% block="drive $direction $cm cm and turn $turn $degrees degrees"
    //% cm.min=0 cm.max=255 cm.defl=20
    //% degrees.min=0 degrees.max=360 degrees.defl=0
    //% direction.defl=MipDirection.Forward
    //% turn.defl=MipTurn.Right
    //% group="Drive" weight=70
    //% blockId=mip_distance
    export function driveDistance(direction: MipDirection, cm: number, turn: MipTurn, degrees: number) {
        steerToken++
        const token = steerToken
        const back = direction == MipDirection.Back ? 1 : 0
        const right = turn == MipTurn.Right ? 1 : 0
        send(mipPackets.distanceDrive(back, cm, right, degrees))
        const signed = back ? -18 : 18
        const spin = right ? degrees : -degrees
        let wait = Math.round(cm / 14 * 1000 + degrees / 360 * 700) + 200
        if (wait < 200) wait = 200
        if (wait > 15000) wait = 15000
        previewMotion(signed, 0, Math.max(200, wait - degrees * 2))
        previewSpin(spin, wait)
        pauseUnlessStopped(wait, token)
    }

    /**
     * Send one steering command. Speed and turn are -100 to 100 percent.
     * Positive speed drives forward. Positive turn steers right.
     * MiP coasts to a stop unless another steer command arrives within about 50 ms.
     */
    //% block="steer speed $speed percent turn $turn percent"
    //% speed.min=-100 speed.max=100 speed.defl=40
    //% turn.min=-100 turn.max=100 turn.defl=0
    //% group="Drive" weight=50
    //% blockId=mip_steer
    export function steer(speed: number, turn: number) {
        const forward = scaleSigned(speed, 32)
        const spin = scaleSigned(turn, 32)
        send(mipPackets.continuousDrive(forward, spin))
        previewMotion(forward, spin * 0.45, 160)
    }

    /**
     * Keep steering for a length of time, then stop.
     */
    //% block="steer speed $speed percent turn $turn percent for $ms ms"
    //% speed.min=-100 speed.max=100 speed.defl=40
    //% turn.min=-100 turn.max=100 turn.defl=0
    //% ms.shadow=timePicker ms.defl=1000
    //% group="Drive" weight=60
    //% blockId=mip_steer_for
    export function steerFor(speed: number, turn: number, ms: number) {
        steerToken++
        const token = steerToken
        const forward = scaleSigned(speed, 32)
        const spin = scaleSigned(turn, 32)
        previewMotion(forward, spin * 0.45, ms)
        let left = ms
        if (left < 0) left = 0
        while (left > 0 && token == steerToken) {
            send(mipPackets.continuousDrive(forward, spin))
            const step = left > 50 ? 50 : left
            pause(step)
            left -= step
        }
        if (token == steerToken) sendStopPacket()
    }

    /**
     * Arrow keys drive MiP until you call stop or turn this off.
     * Up and down set speed. Left and right steer.
     */
    //% block="drive MiP with arrow keys $on"
    //% on.shadow=toggleOnOff
    //% on.defl=true
    //% group="Drive" weight=100
    //% blockId=mip_arrows
    export function driveWithArrows(on: boolean) {
        arrowsOn = on
        if (!on && arrowsWereDown) {
            arrowsWereDown = false
            sendStopPacket()
        }
    }

    /**
     * Stop the current move.
     */
    //% block="stop MiP"
    //% group="Drive" weight=40
    //% blockId=mip_stop
    export function stop() {
        steerToken++
        arrowsWereDown = false
        sendStopPacket()
    }

    function rememberChest(r: number, g: number, b: number) {
        chestR = r & 0xff
        chestG = g & 0xff
        chestB = b & 0xff
        refreshRobot()
    }

    /**
     * Set the chest light to a named color.
     */
    //% block="set chest light $color"
    //% color.defl=MipColor.Green
    //% group="Lights" weight=90
    //% blockId=mip_chest
    export function setChestColor(color: MipColor) {
        const rgb = colorRgb(color)
        rememberChest(rgb[0], rgb[1], rgb[2])
        send(mipPackets.setChest(rgb[0], rgb[1], rgb[2]))
    }

    /**
     * Set the chest light with red, green, and blue from 0 to 255.
     */
    //% block="set chest red $r green $g blue $b"
    //% r.min=0 r.max=255 r.defl=0
    //% g.min=0 g.max=255 g.defl=255
    //% b.min=0 b.max=255 b.defl=0
    //% group="Lights" weight=60 advanced=true
    //% blockId=mip_chest_rgb
    export function setChestRgb(r: number, g: number, b: number) {
        rememberChest(r, g, b)
        send(mipPackets.setChest(r, g, b))
    }

    /**
     * Flash the chest light. On and off times are in milliseconds.
     */
    //% block="flash chest $color || on $onMs ms off $offMs ms"
    //% color.defl=MipColor.Red
    //% onMs.shadow=timePicker onMs.defl=200
    //% offMs.shadow=timePicker offMs.defl=200
    //% expandableArgumentMode="toggle"
    //% group="Lights" weight=70
    //% blockId=mip_flash
    export function flashChest(color: MipColor, onMs: number = 200, offMs: number = 200) {
        const rgb = colorRgb(color)
        rememberChest(rgb[0], rgb[1], rgb[2])
        send(mipPackets.flashChest(rgb[0], rgb[1], rgb[2], onMs, offMs))
    }

    function applyLook(look: MipLook) {
        if (look == MipLook.Off) setEyes(MipEye.Off, MipEye.Off, MipEye.Off, MipEye.Off)
        else if (look == MipLook.Blink) setEyes(MipEye.Blink, MipEye.Blink, MipEye.Blink, MipEye.Blink)
        else if (look == MipLook.BlinkFast) setEyes(MipEye.BlinkFast, MipEye.BlinkFast, MipEye.BlinkFast, MipEye.BlinkFast)
        else if (look == MipLook.Left) setEyes(MipEye.On, MipEye.On, MipEye.Off, MipEye.Off)
        else if (look == MipLook.Right) setEyes(MipEye.Off, MipEye.Off, MipEye.On, MipEye.On)
        else setEyes(MipEye.On, MipEye.On, MipEye.On, MipEye.On)
    }

    /**
     * Set a face using the four head lights, from the robot's left to right.
     */
    //% block="set eyes $look"
    //% look.defl=MipLook.On
    //% group="Lights" weight=80
    //% blockId=mip_look
    export function setLook(look: MipLook) {
        applyLook(look)
    }

    /**
     * Set each head light. Lights are ordered from the robot's left to right.
     */
    //% block="set eye lights $l1 $l2 $l3 $l4"
    //% l1.defl=MipEye.On l2.defl=MipEye.On l3.defl=MipEye.On l4.defl=MipEye.On
    //% group="Lights" weight=50 advanced=true
    //% blockId=mip_eyes
    export function setEyes(l1: MipEye, l2: MipEye, l3: MipEye, l4: MipEye) {
        eye1 = l1
        eye2 = l2
        eye3 = l3
        eye4 = l4
        refreshRobot()
        send(mipPackets.setHead(l1, l2, l3, l4))
    }

    /**
     * Play one of MiP's sounds.
     */
    //% block="play sound $sound"
    //% sound.defl=MipSound.Hello
    //% group="Sound" weight=90
    //% blockId=mip_sound
    export function playSound(sound: MipSound) {
        send(mipPackets.playSound(sound, 0))
    }

    /**
     * Play a sound by number, from 1 to 106.
     * 105 cuts off the sound that is playing.
     */
    //% block="play sound number $index"
    //% index.min=1 index.max=255 index.defl=35
    //% group="Sound" weight=70 advanced=true
    //% blockId=mip_sound_number
    export function playSoundNumber(index: number) {
        send(mipPackets.playSound(index, 0))
    }

    /**
     * Set the speaker volume from 0 (silent) to 7 (loudest).
     */
    //% block="set volume to $level"
    //% level.min=0 level.max=7 level.defl=5
    //% group="Sound" weight=80
    //% blockId=mip_set_volume
    export function setVolume(level: number) {
        volumeLevel = level
        if (volumeLevel < 0) volumeLevel = 0
        if (volumeLevel > 7) volumeLevel = 7
        send(mipPackets.setVolume(volumeLevel))
    }

    /**
     * Fall onto the back or face.
     */
    //% block="fall $direction"
    //% direction.defl=MipFall.FaceDown
    //% group="Actions" weight=80
    //% blockId=mip_fall
    export function fall(direction: MipFall) {
        steerToken++
        simForward = 0
        simTurnRate = 0
        send(mipPackets.fallDown(direction))
    }

    /**
     * Try to stand up after a fall.
     */
    //% block="get up $side"
    //% side.defl=MipGetUp.Either
    //% group="Actions" weight=70
    //% blockId=mip_get_up
    export function getUp(side: MipGetUp) {
        send(mipPackets.getUp(side))
    }

    /**
     * Switch MiP into one of its built-in games.
     * Manual is the mode used for driving.
     */
    //% block="set game $mode"
    //% mode.defl=MipGame.Manual
    //% group="Actions" weight=60
    //% blockId=mip_game_mode
    export function setGame(mode: MipGame) {
        if (mode == MipGame.Manual) sensorChoice = MipSensorMode.Off
        send(mipPackets.gameMode(mode))
    }

    /**
     * Listen for hand gestures, watch the distance sensor, or turn both off.
     */
    //% block="set sensors $mode"
    //% mode.defl=MipSensorMode.Gesture
    //% group="Actions" weight=50
    //% blockId=mip_sensor_mode
    export function setSensors(mode: MipSensorMode) {
        sensorChoice = mode
        if (!connected) return
        if (mode == MipSensorMode.Off) {
            send(mipPackets.sensorMode(MipSensorMode.Off))
            send(mipPackets.gameMode(MipGame.Manual))
        } else {
            send(mipPackets.sensorMode(mode))
        }
    }

    /**
     * Power down MiP's Bluetooth radio. Wake the robot with its power switch.
     */
    //% block="sleep MiP"
    //% group="Actions" weight=40 advanced=true
    //% blockId=mip_sleep
    export function sleep() {
        steerToken++
        send(mipPackets.sleep())
        connected = false
    }

    /**
     * Battery level from the latest status report, 0 to 100 percent.
     */
    //% block="battery level"
    //% group="Sensors" weight=100
    //% blockId=mip_battery
    export function batteryLevel(): number {
        return battery
    }

    /**
     * How MiP is sitting, from the latest status report.
     */
    //% block="posture"
    //% group="Sensors" weight=90
    //% blockId=mip_posture
    export function postureNow(): MipPosture {
        return posture
    }

    /**
     * Latest distance-sensor reading. Radar mode has to be on.
     */
    //% block="radar"
    //% group="Sensors" weight=80
    //% blockId=mip_radar
    export function radarNow(): MipRadar {
        return radar
    }

    /**
     * Centimetres travelled since the odometer was reset.
     */
    //% block="distance travelled (cm)"
    //% group="Sensors" weight=70
    //% blockId=mip_odometer
    export function distanceTravelled(): number {
        return odometerCm
    }

    /**
     * Set the travelled-distance counter back to 0.
     */
    //% block="reset distance travelled"
    //% group="Sensors" weight=20
    //% blockId=mip_reset_odometer
    export function resetDistance() {
        odometerCm = 0
        send(mipPackets.resetOdometer())
    }

    /**
     * Tray tilt in degrees. Negative means weight toward the front.
     */
    //% block="tray tilt"
    //% group="Sensors" weight=60
    //% blockId=mip_tray_tilt
    export function tilt(): number {
        return trayTilt
    }

    /**
     * How many claps were in the latest clap.
     */
    //% block="claps heard"
    //% group="Sensors" weight=50
    //% blockId=mip_claps
    export function claps(): number {
        return lastClaps
    }

    /**
     * The latest hand gesture MiP reported.
     */
    //% block="last gesture"
    //% group="Sensors" weight=40
    //% blockId=mip_last_gesture
    export function lastGesture(): MipGesture {
        return lastGestureValue
    }

    /**
     * Volume from the latest report, 0 to 7.
     */
    //% block="volume"
    //% group="Sensors" weight=30
    //% blockId=mip_volume
    export function volume(): number {
        return volumeLevel
    }

    /**
     * Firmware date reported by MiP, as year-month-day.revision.
     */
    //% block="firmware"
    //% group="Sensors" weight=10 advanced=true
    //% blockId=mip_firmware
    export function firmwareText(): string {
        return firmware
    }

    /**
     * Run when MiP sees this hand gesture. Turn sensors to gesture first.
     */
    //% block="on gesture $gesture"
    //% gesture.defl=MipGesture.Forward
    //% group="Events" weight=90
    //% blockId=mip_on_gesture
    export function onGesture(gesture: MipGesture, handler: () => void) {
        sensorChoice = MipSensorMode.Gesture
        if (connected) send(mipPackets.sensorMode(MipSensorMode.Gesture))
        control.onEvent(gestureSrc, gesture, handler)
    }

    /**
     * Run when the distance sensor reports this range. Turn sensors to radar first.
     */
    //% block="on radar $zone"
    //% zone.defl=MipRadar.Close
    //% group="Events" weight=80
    //% blockId=mip_on_radar
    export function onRadar(zone: MipRadar, handler: () => void) {
        sensorChoice = MipSensorMode.Radar
        if (connected) send(mipPackets.sensorMode(MipSensorMode.Radar))
        control.onEvent(radarSrc, zone, handler)
    }

    /**
     * Run when MiP is shaken.
     */
    //% block="on shake"
    //% group="Events" weight=70
    //% blockId=mip_on_shake
    export function onShake(handler: () => void) {
        control.onEvent(shakeSrc, 1, handler)
    }

    /**
     * Run when MiP hears a clap. Clap detection is turned on for you.
     */
    //% block="on clap"
    //% group="Events" weight=60
    //% blockId=mip_on_clap
    export function onClap(handler: () => void) {
        wantClap = true
        if (connected) send(mipPackets.enableClap(1))
        control.onEvent(clapSrc, 1, handler)
    }

    /**
     * Run when MiP changes to this posture.
     */
    //% block="on posture $posture"
    //% posture.defl=MipPosture.PickedUp
    //% group="Events" weight=50
    //% blockId=mip_on_posture
    export function onPosture(posture: MipPosture, handler: () => void) {
        control.onEvent(postureSrc, posture, handler)
    }

    function colorRgb(color: MipColor): number[] {
        if (color == MipColor.Off) return [0, 0, 0]
        if (color == MipColor.Red) return [255, 0, 0]
        if (color == MipColor.Green) return [0, 255, 0]
        if (color == MipColor.Blue) return [0, 0, 255]
        if (color == MipColor.Yellow) return [255, 220, 0]
        if (color == MipColor.Purple) return [180, 0, 255]
        if (color == MipColor.White) return [255, 255, 255]
        if (color == MipColor.Cyan) return [0, 220, 255]
        return [255, 110, 0]
    }

    boot()
}

