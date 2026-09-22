// WowWee MiP command bytes. Keep in sync with packets.ts.
// Spec: https://github.com/WowWeeLabs/MiP-BLE-Protocol

function clamp(value, lo, hi) {
    if (value < lo) return lo
    if (value > hi) return hi
    return value | 0
}

// velocity and turnRate are -32..32. Positive velocity is forward.
// Positive turnRate is right (clockwise).
function continuousDrive(velocity, turnRate) {
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

// speed 0..30, ms is converted to 7ms steps (max about 1.785s).
function driveTimed(backward, speed, ms) {
    speed = clamp(speed, 0, 30)
    let units = Math.round(ms / 7)
    if (ms > 0 && units < 1) units = 1
    if (units > 255) units = 255
    if (units < 0) units = 0
    return [backward ? 0x72 : 0x71, speed, units]
}

// degrees are turned in steps of 5. speed is 0..24.
function turnAngle(right, degrees, speed) {
    let angle = Math.round(degrees / 5)
    if (angle < 0) angle = 0
    if (angle > 255) angle = 255
    speed = clamp(speed, 0, 24)
    return [right ? 0x74 : 0x73, angle, speed]
}

// cm 0..255, degrees 0..360. clockwise 1 is a right turn.
function distanceDrive(backward, cm, clockwise, degrees) {
    cm = clamp(cm, 0, 255)
    degrees = clamp(Math.round(degrees), 0, 360)
    return [0x70, backward ? 1 : 0, cm, clockwise ? 1 : 0, (degrees >> 8) & 0xff, degrees & 0xff]
}

function setChest(r, g, b) {
    return [0x84, clamp(r, 0, 255), clamp(g, 0, 255), clamp(b, 0, 255)]
}

function flashChest(r, g, b, onMs, offMs) {
    let on = Math.round(onMs / 20)
    let off = Math.round(offMs / 20)
    return [0x89, clamp(r, 0, 255), clamp(g, 0, 255), clamp(b, 0, 255), clamp(on, 0, 255), clamp(off, 0, 255)]
}

function setHead(l1, l2, l3, l4) {
    return [0x8a, clamp(l1, 0, 3), clamp(l2, 0, 3), clamp(l3, 0, 3), clamp(l4, 0, 3)]
}

function playSound(index, delayMs) {
    let delay = Math.round((delayMs || 0) / 30)
    if (delay < 0) delay = 0
    if (delay > 255) delay = 255
    let sound = index | 0
    if (sound < 0) sound = 0
    if (sound > 255) sound = 255
    return [0x06, sound, delay]
}

function setVolume(level) {
    return [0x15, clamp(level, 0, 7)]
}

function gameMode(mode) {
    return [0x76, clamp(mode, 1, 8)]
}

function sensorMode(mode) {
    return [0x0c, mode & 0xff]
}

function fallDown(direction) {
    return [0x08, direction ? 1 : 0]
}

function getUp(mode) {
    return [0x23, clamp(mode, 0, 2)]
}

function enableClap(on) {
    return [0x1e, on ? 1 : 0]
}

function stop() {
    return [0x77]
}

function sleep() {
    return [0xfa]
}

function readStatus() {
    return [0x79]
}

function readOdometer() {
    return [0x85]
}

function resetOdometer() {
    return [0x86]
}

function readVolume() {
    return [0x16]
}

function readWeight() {
    return [0x81]
}

function readVersion() {
    return [0x14]
}

const api = {
    clamp,
    continuousDrive,
    driveTimed,
    turnAngle,
    distanceDrive,
    setChest,
    flashChest,
    setHead,
    playSound,
    setVolume,
    gameMode,
    sensorMode,
    fallDown,
    getUp,
    enableClap,
    stop,
    sleep,
    readStatus,
    readOdometer,
    resetOdometer,
    readVolume,
    readWeight,
    readVersion
}

if (typeof module !== "undefined" && module.exports) module.exports = api
if (typeof globalThis !== "undefined") globalThis.MipPackets = api
