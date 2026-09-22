const assert = require("assert")
const fs = require("fs")
const path = require("path")
const packets = require("../connect/packets.js")
const ble = require("../connect/ble.js")

function loadPacketsTs() {
    let js = fs.readFileSync(path.join(__dirname, "../packets.ts"), "utf8")
    js = js.replace(/\/\*[\s\S]*?\*\//g, "")
    js = js.replace(/\/\/.*$/gm, "")
    js = js.replace(/namespace mipPackets\s*\{/, "")
    js = js.replace(/\}\s*$/, "")
    js = js.replace(/export function /g, "function ")
    js = js.replace(/: number\[\]/g, "")
    js = js.replace(/: number/g, "")
    const names = Object.keys(packets).filter(name => name !== "clamp")
    return new Function(js + "\nreturn {" + names.join(",") + "}")()
}

const fromTs = loadPacketsTs()

function same(name, args, expected) {
    const jsValue = packets[name].apply(null, args)
    const tsValue = fromTs[name].apply(null, args)
    assert.deepStrictEqual(jsValue, expected, name + " js")
    assert.deepStrictEqual(tsValue, expected, name + " ts")
}

same("continuousDrive", [16, 8], [0x78, 16, 0x48])
same("continuousDrive", [-16, -8], [0x78, 0x30, 0x68])
same("continuousDrive", [0, 0], [0x78, 0, 0])
same("continuousDrive", [32, 32], [0x78, 0x20, 0x60])
same("continuousDrive", [-32, -32], [0x78, 0x40, 0x80])
same("continuousDrive", [100, -100], [0x78, 0x20, 0x80])
same("driveTimed", [0, 15, 1000], [0x71, 15, 143])
same("driveTimed", [1, 15, 7], [0x72, 15, 1])
same("driveTimed", [0, 15, 1], [0x71, 15, 1])
same("turnAngle", [0, 180, 12], [0x73, 36, 12])
same("turnAngle", [1, 180, 12], [0x74, 36, 12])
same("turnAngle", [1, 5, 0], [0x74, 1, 0])
same("distanceDrive", [0, 30, 1, 0], [0x70, 0, 30, 1, 0, 0])
same("distanceDrive", [1, 255, 0, 360], [0x70, 1, 255, 0, 0x01, 0x68])
same("setChest", [255, 0, 8], [0x84, 255, 0, 8])
same("flashChest", [255, 0, 0, 1000, 1000], [0x89, 255, 0, 0, 50, 50])
same("setHead", [0, 1, 2, 3], [0x8a, 0, 1, 2, 3])
same("setHead", [9, -1, 2, 3], [0x8a, 3, 0, 2, 3])
same("playSound", [35, 0], [0x06, 35, 0])
same("playSound", [105, 30], [0x06, 105, 1])
same("setVolume", [7], [0x15, 7])
same("setVolume", [99], [0x15, 7])
same("gameMode", [1], [0x76, 1])
same("sensorMode", [2], [0x0c, 2])
same("fallDown", [1], [0x08, 1])
same("fallDown", [0], [0x08, 0])
same("getUp", [2], [0x23, 2])
same("enableClap", [1], [0x1e, 1])
same("stop", [], [0x77])
same("sleep", [], [0xfa])
same("readStatus", [], [0x79])
same("readOdometer", [], [0x85])
same("resetOdometer", [], [0x86])
same("readVolume", [], [0x16])
same("readWeight", [], [0x81])
same("readVersion", [], [0x14])

const ascii = Uint8Array.from([0x31, 0x34, 0x30, 0x45, 0x30, 0x32, 0x31, 0x42, 0x30, 0x37])
assert.deepStrictEqual(Array.from(ble.decodeNotification(ascii)), [0x14, 0x0e, 0x02, 0x1b, 0x07])
assert.deepStrictEqual(Array.from(ble.decodeNotification(Uint8Array.from([0x79, 0x60, 0x02]))), [0x79, 0x60, 0x02])
assert.deepStrictEqual(Array.from(ble.decodeNotification(Uint8Array.from([0x31, 0x34, 0x30]))), [0x31, 0x34, 0x30])

const mip = fs.readFileSync(path.join(__dirname, "../mip.ts"), "utf8")
for (const name of ["OP_HELLO", "OP_DISCONNECT", "OP_WRITE", "OP_STATUS", "OP_ERROR", "OP_NOTIFY"]) {
    assert.ok(mip.includes(name), name + " missing from mip.ts")
    assert.strictEqual(parseInt(mip.match(new RegExp(name + " = (0x[0-9a-f]+)"))[1], 16), ble[name])
}

assert.deepStrictEqual(Array.from(ble.toBytes([1, 2, 16])), [1, 2, 16])
assert.deepStrictEqual(Array.from(ble.toBytes(Uint8Array.from([0x10, 0x77]))), [0x10, 0x77])

const filtered = ble.deviceRequestOptions(false)
assert.ok(filtered.filters.some(function (filter) {
    return filter.services && filter.services.indexOf("0000fff0-0000-1000-8000-00805f9b34fb") >= 0
        && filter.services.indexOf("0000ffb0-0000-1000-8000-00805f9b34fb") >= 0
}))
assert.ok(filtered.filters.some(function (filter) {
    return filter.manufacturerData && filter.manufacturerData[0].companyIdentifier === 0x0500
}))
assert.strictEqual(ble.deviceRequestOptions(true).acceptAllDevices, true)

console.log("protocol tests passed")
