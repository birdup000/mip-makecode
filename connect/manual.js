// Direct controller for the page in index.html.
const session = MipBle.createSession()
const packets = MipPackets
const held = { up: false, down: false, left: false, right: false }
let wasMoving = false
let connecting = false

const statusNode = document.querySelector("[data-status]")
const hexNode = document.querySelector("[data-hex]")
const connectButton = document.querySelector("[data-connect]")
const helpNode = document.querySelector("[data-bt-help]")
const cmdNode = document.querySelector("[data-bt-cmd]")
const bluetoothReady = !!(navigator.bluetooth && navigator.bluetooth.requestDevice)
const userAgent = navigator.userAgent
const isChromium = /Chrome|Chromium|Edg\//.test(userAgent)

const launchCommand = (function () {
    let binary = "google-chrome"
    if (/Edg\//.test(userAgent)) binary = "microsoft-edge"
    else if (typeof navigator.brave !== "undefined") binary = "brave-browser"
    else if (/Chromium\//.test(userAgent)) binary = "chromium"
    return binary + " --enable-features=WebBluetooth " + location.href
})()

function bluetoothOffMessage() {
    if (!isChromium) return "This browser has no Web Bluetooth. Open this page in Chrome, Edge or Brave."
    return "Web Bluetooth is off in this browser. Quit it completely, then run start.sh from this folder."
}

function showBluetoothHelp() {
    if (!helpNode) return
    if (cmdNode) cmdNode.textContent = launchCommand
    helpNode.hidden = false
}

function showStatus(text) {
    statusNode.textContent = text
}

function showHex(bytes) {
    const parts = []
    for (let i = 0; i < bytes.length; i++) {
        const hex = bytes[i].toString(16)
        parts.push(hex.length < 2 ? "0" + hex : hex)
    }
    hexNode.textContent = parts.join(" ")
}

function send(bytes) {
    showHex(bytes)
    session.write(bytes)
}

session.onStatus(function (isConnected, name, error) {
    connecting = false
    connectButton.disabled = false
    if (error === 1) {
        showBluetoothHelp()
        showStatus(bluetoothOffMessage())
    }
    else if (error === 2) showStatus("No robot was picked.")
    else if (error === 3) showStatus("Could not connect. Wake MiP and try again.")
    else if (error === 4) showStatus("MiP disconnected.")
    else if (error === 5) showStatus("This page is not in a secure context. Serve it over HTTPS or open via localhost (e.g. python3 -m http.server).")
    else if (error === 6) showStatus("Bluetooth permission was denied. Click the lock icon in the address bar and allow Bluetooth, then reload.")
    else if (isConnected) showStatus("Connected to " + (name || "MiP") + ".")
    else showStatus("Not connected.")
    connectButton.textContent = isConnected ? "Disconnect" : "Connect MiP"
})

// Show current Bluetooth permission state on page load.
if (!bluetoothReady) {
    showBluetoothHelp()
    showStatus(bluetoothOffMessage())
} else if (session.checkPermission) {
    session.checkPermission().then(function (state) {
        if (state === "denied") {
            showBluetoothHelp()
            showStatus("Bluetooth is blocked for this site. Click the lock icon in the address bar and allow Bluetooth, then reload.")
        } else if (state === "granted") {
            showStatus("Bluetooth ready. Connect MiP to begin.")
        }
    })
}

function beginConnect(acceptAll) {
    if (connecting) return
    if (!bluetoothReady) {
        showBluetoothHelp()
        showStatus(bluetoothOffMessage())
        return
    }
    connecting = true
    connectButton.disabled = true
    showStatus("Look for the Bluetooth picker in Chrome and choose Mip-…")
    session.connect(acceptAll)
}

connectButton.addEventListener("click", function () {
    if (session.isConnected()) {
        session.disconnect()
        return
    }
    beginConnect(false)
})

document.querySelector("[data-any]").addEventListener("click", function () {
    beginConnect(true)
})

const copyCommandButton = document.querySelector("[data-copy-cmd]")
if (copyCommandButton) {
    copyCommandButton.addEventListener("click", function () {
        navigator.clipboard.writeText(launchCommand).then(function () {
            copyCommandButton.textContent = "Command copied"
        }).catch(function () {
            showBluetoothHelp()
        })
    })
}

document.querySelector("[data-stop]").addEventListener("click", function () {
    wasMoving = false
    send(packets.stop())
})

document.querySelector("[data-fall]").addEventListener("click", function () {
    send(packets.fallDown(1))
})

document.querySelector("[data-up]").addEventListener("click", function () {
    send(packets.getUp(2))
})

document.querySelector("[data-sound]").addEventListener("click", function () {
    const index = Number(document.querySelector("[data-sound-list]").value)
    send(packets.playSound(index, 0))
})

document.querySelector("[data-volume]").addEventListener("change", function (event) {
    send(packets.setVolume(Number(event.target.value)))
})

const colors = document.querySelectorAll("[data-color]")
for (let i = 0; i < colors.length; i++) {
    colors[i].addEventListener("click", function () {
        const parts = colors[i].getAttribute("data-color").split(",")
        send(packets.setChest(Number(parts[0]), Number(parts[1]), Number(parts[2])))
    })
}

function setHeld(name, down) {
    held[name] = down
}

const pads = document.querySelectorAll("[data-dir]")
for (let i = 0; i < pads.length; i++) {
    const name = pads[i].getAttribute("data-dir")
    pads[i].addEventListener("pointerdown", function (event) {
        event.preventDefault()
        setHeld(name, true)
        try { pads[i].setPointerCapture(event.pointerId) } catch (err) {}
    })
    const release = function () { setHeld(name, false) }
    pads[i].addEventListener("pointerup", release)
    pads[i].addEventListener("pointercancel", release)
}

document.addEventListener("keydown", function (event) {
    const map = { ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right" }
    if (!map[event.key]) return
    if (event.target && (event.target.tagName === "INPUT" || event.target.tagName === "SELECT")) return
    event.preventDefault()
    setHeld(map[event.key], true)
})

document.addEventListener("keyup", function (event) {
    const map = { ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right" }
    if (!map[event.key]) return
    setHeld(map[event.key], false)
})

setInterval(function () {
    let speed = 0
    let turn = 0
    if (held.up && !held.down) speed = 16
    else if (held.down && !held.up) speed = -16
    if (held.right && !held.left) turn = 12
    else if (held.left && !held.right) turn = -12
    if (speed !== 0 || turn !== 0) {
        wasMoving = true
        send(packets.continuousDrive(speed, turn))
    } else if (wasMoving) {
        wasMoving = false
        send(packets.stop())
    }
}, 50)

const volumeLabel = document.querySelector("[data-volume-label]")
document.querySelector("[data-volume]").addEventListener("input", function (event) {
    volumeLabel.textContent = event.target.value
})

let bookmarkUrl = ""
fetch("ble.js").then(function (response) { return response.text() }).then(function (code) {
    const link = document.querySelector("[data-bookmark]")
    bookmarkUrl = "javascript:" + encodeURIComponent(code)
    link.href = bookmarkUrl
    link.textContent = "MiP Connect"
    document.querySelector("[data-bookmark-note]").textContent = "Drag MiP Connect to the bookmarks bar."
}).catch(function () {
    document.querySelector("[data-bookmark-note]").textContent = "Open this folder with a local web server so the bookmarklet can be built."
})

document.querySelector("[data-copy]").addEventListener("click", function () {
    if (!bookmarkUrl) return
    navigator.clipboard.writeText(bookmarkUrl).then(function () {
        document.querySelector("[data-bookmark-note]").textContent = "Bookmarklet copied. Create a bookmark and paste it as the URL."
    }).catch(function () {
        document.querySelector("[data-bookmark-note]").textContent = "Drag the MiP Connect link to the bookmarks bar."
    })
})
