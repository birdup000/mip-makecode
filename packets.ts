// Byte layouts for the WowWee MiP BLE protocol.
// Keep in sync with connect/packets.js.
namespace mipPackets {
    function clamp(value: number, lo: number, hi: number): number {
        if (value < lo) return lo
        if (value > hi) return hi
        return value | 0
    }

    // velocity and turnRate are -32..32. Positive velocity is forward.
    // Positive turnRate is right (clockwise).
    export function continuousDrive(velocity: number, turnRate: number): number[] {
        velocity = clamp(velocity, -32, 32)
        turnRate = clamp(turnRate, -32, 32)
        let forward = 0
        if (velocity < 0) forward = 0x20 + (-velocity)
        else forward = velocity
        let turn = 0
        if (turnRate < 0) turn = 0x60 + (-turnRate)
        else if (turnRate > 0) turn = 0x40 + turnRate
        return [0x78, forward, turn]
    }

    export function driveTimed(backward: number, speed: number, ms: number): number[] {
        speed = clamp(speed, 0, 30)
        let units = Math.round(ms / 7)
        if (ms > 0 && units < 1) units = 1
        if (units > 255) units = 255
        if (units < 0) units = 0
        return [backward ? 0x72 : 0x71, speed, units]
    }

    export function turnAngle(right: number, degrees: number, speed: number): number[] {
        let angle = Math.round(degrees / 5)
        if (angle < 0) angle = 0
        if (angle > 255) angle = 255
        speed = clamp(speed, 0, 24)
        return [right ? 0x74 : 0x73, angle, speed]
    }

    export function distanceDrive(backward: number, cm: number, clockwise: number, degrees: number): number[] {
        cm = clamp(cm, 0, 255)
        degrees = clamp(Math.round(degrees), 0, 360)
        return [0x70, backward ? 1 : 0, cm, clockwise ? 1 : 0, (degrees >> 8) & 0xff, degrees & 0xff]
    }

    export function setChest(r: number, g: number, b: number): number[] {
        return [0x84, clamp(r, 0, 255), clamp(g, 0, 255), clamp(b, 0, 255)]
    }

    export function flashChest(r: number, g: number, b: number, onMs: number, offMs: number): number[] {
        let on = Math.round(onMs / 20)
        let off = Math.round(offMs / 20)
        return [0x89, clamp(r, 0, 255), clamp(g, 0, 255), clamp(b, 0, 255), clamp(on, 0, 255), clamp(off, 0, 255)]
    }

    export function setHead(l1: number, l2: number, l3: number, l4: number): number[] {
        return [0x8a, clamp(l1, 0, 3), clamp(l2, 0, 3), clamp(l3, 0, 3), clamp(l4, 0, 3)]
    }

    export function playSound(index: number, delayMs: number): number[] {
        let delay = Math.round((delayMs || 0) / 30)
        if (delay < 0) delay = 0
        if (delay > 255) delay = 255
        let sound = index | 0
        if (sound < 0) sound = 0
        if (sound > 255) sound = 255
        return [0x06, sound, delay]
    }

    export function setVolume(level: number): number[] {
        return [0x15, clamp(level, 0, 7)]
    }

    export function gameMode(mode: number): number[] {
        return [0x76, clamp(mode, 1, 8)]
    }

    export function sensorMode(mode: number): number[] {
        return [0x0c, mode & 0xff]
    }

    export function fallDown(direction: number): number[] {
        return [0x08, direction ? 1 : 0]
    }

    export function getUp(mode: number): number[] {
        return [0x23, clamp(mode, 0, 2)]
    }

    export function enableClap(on: number): number[] {
        return [0x1e, on ? 1 : 0]
    }

    export function stop(): number[] {
        return [0x77]
    }

    export function sleep(): number[] {
        return [0xfa]
    }

    export function readStatus(): number[] {
        return [0x79]
    }

    export function readOdometer(): number[] {
        return [0x85]
    }

    export function resetOdometer(): number[] {
        return [0x86]
    }

    export function readVolume(): number[] {
        return [0x16]
    }

    export function readWeight(): number[] {
        return [0x81]
    }

    export function readVersion(): number[] {
        return [0x14]
    }
}
