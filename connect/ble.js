// Bluetooth bridge for the WowWee MiP.
// MakeCode Arcade's simulator frame cannot open a Bluetooth chooser, so this
// file runs on the MakeCode page itself (via the bookmarklet) or in connect/index.html.
// Opcodes must match mip.ts.

(function (root) {
    const CHANNEL = "mip"
    const OP_HELLO = 0x01
    const OP_DISCONNECT = 0x02
    const OP_WRITE = 0x10
    const OP_STATUS = 0x80
    const OP_ERROR = 0x81
    const OP_NOTIFY = 0x90
    const SEND_SERVICE = "0000ffe5-0000-1000-8000-00805f9b34fb"
    const SEND_CHAR = "0000ffe9-0000-1000-8000-00805f9b34fb"
    const RECV_SERVICE = "0000ffe0-0000-1000-8000-00805f9b34fb"
    const RECV_CHAR = "0000ffe4-0000-1000-8000-00805f9b34fb"
    const SERVICES = [SEND_SERVICE, RECV_SERVICE]

    function decodeNotification(bytes) {
        if (!bytes || bytes.length < 2 || bytes.length % 2 !== 0) return copyBytes(bytes)
        for (let i = 0; i < bytes.length; i++) {
            const c = bytes[i]
            const hex = (c >= 48 && c <= 57) || (c >= 65 && c <= 70) || (c >= 97 && c <= 102)
            if (!hex) return copyBytes(bytes)
        }
        const out = new Uint8Array(bytes.length / 2)
        for (let i = 0; i < out.length; i++) {
            const hi = String.fromCharCode(bytes[i * 2])
            const lo = String.fromCharCode(bytes[i * 2 + 1])
            out[i] = parseInt(hi + lo, 16)
        }
        return out
    }

    function copyBytes(bytes) {
        if (!bytes) return new Uint8Array()
        return new Uint8Array(bytes)
    }

    function toBytes(data) {
        if (!data) return new Uint8Array()
        if (data instanceof Uint8Array) return data
        if (typeof ArrayBuffer !== "undefined" && ArrayBuffer.isView && ArrayBuffer.isView(data)) {
            return new Uint8Array(data.buffer, data.byteOffset, data.byteLength)
        }
        if (data instanceof ArrayBuffer) return new Uint8Array(data)
        if (Array.isArray(data)) return Uint8Array.from(data)
        if (typeof data.length === "number") {
            const out = new Uint8Array(data.length)
            for (let i = 0; i < data.length; i++) out[i] = data[i] & 255
            return out
        }
        return new Uint8Array()
    }

    function createSession() {
        let device = null
        let tx = null
        let linkName = ""
        let ignoreDrop = false
        let drive = null
        let queued = []
        let writing = false
        const statusHandlers = []
        const notifyHandlers = []

        function emitStatus(isConnected, name, error) {
            for (let i = 0; i < statusHandlers.length; i++) {
                statusHandlers[i](!!isConnected, name || "", error || 0)
            }
        }

        function emitNotify(bytes) {
            for (let i = 0; i < notifyHandlers.length; i++) notifyHandlers[i](bytes)
        }

        function clearLink() {
            device = null
            tx = null
            linkName = ""
            drive = null
            queued = []
            writing = false
        }

        function onNotify(event) {
            const view = event.target && event.target.value
            if (!view) return
            const raw = new Uint8Array(view.buffer, view.byteOffset, view.byteLength)
            emitNotify(decodeNotification(raw))
        }

        async function writeNow(bytes) {
            if (!tx) return
            const data = new Uint8Array(bytes)
            if (tx.writeValueWithoutResponse) await tx.writeValueWithoutResponse(data)
            else await tx.writeValue(data)
        }

        function pump() {
            if (writing || !tx) return
            let next = null
            if (queued.length) next = queued.shift()
            else if (drive) {
                next = drive
                drive = null
            } else return
            writing = true
            writeNow(next).then(function () {
                writing = false
                pump()
            }).catch(function () {
                writing = false
            })
        }

        function enqueue(bytes) {
            if (!tx) return
            if (bytes.length > 20) return
            // Continuous drive is replaced so a stream of steer commands cannot lag.
            if (bytes[0] === 0x78) drive = bytes.slice()
            else {
                if (bytes[0] === 0x77) drive = null
                queued.push(bytes.slice())
                if (queued.length > 6) queued.shift()
            }
            pump()
        }

        async function connect(acceptAll) {
            const bluetooth = root.navigator && root.navigator.bluetooth
            if (!bluetooth) {
                emitStatus(false, "", 1)
                return
            }
            try {
                const options = acceptAll
                    ? { acceptAllDevices: true, optionalServices: SERVICES }
                    : {
                        filters: [
                            { namePrefix: "Mip" },
                            { namePrefix: "MiP" },
                            { namePrefix: "MIP" },
                            { namePrefix: "Wow" }
                        ],
                        optionalServices: SERVICES
                    }
                const next = await bluetooth.requestDevice(options)
                if (device && device.gatt && device.gatt.connected) {
                    ignoreDrop = true
                    device.gatt.disconnect()
                }
                tx = null
                drive = null
                queued = []
                device = next
                device.addEventListener("gattserverdisconnected", function () {
                    clearLink()
                    if (ignoreDrop) {
                        ignoreDrop = false
                        return
                    }
                    emitStatus(false, "", 4)
                })
                const server = await device.gatt.connect()
                const sendService = await server.getPrimaryService(SEND_SERVICE)
                tx = await sendService.getCharacteristic(SEND_CHAR)
                const recvService = await server.getPrimaryService(RECV_SERVICE)
                const rx = await recvService.getCharacteristic(RECV_CHAR)
                await rx.startNotifications()
                rx.addEventListener("characteristicvaluechanged", onNotify)
                linkName = device.name || "MiP"
                emitStatus(true, linkName, 0)
            } catch (err) {
                const name = err && err.name
                let code = 3
                if (name === "NotFoundError" || name === "AbortError") code = 2
                if (name === "SecurityError" || name === "NotSupportedError") code = 1
                if (device && device.gatt && device.gatt.connected) {
                    ignoreDrop = true
                    device.gatt.disconnect()
                }
                clearLink()
                emitStatus(false, "", code)
            }
        }

        function disconnect() {
            const live = device && device.gatt && device.gatt.connected
            ignoreDrop = !!live
            if (live) device.gatt.disconnect()
            clearLink()
            emitStatus(false, "", 0)
        }

        return {
            onStatus: function (fn) { statusHandlers.push(fn) },
            onNotify: function (fn) { notifyHandlers.push(fn) },
            isConnected: function () {
                return !!(device && device.gatt && device.gatt.connected && tx)
            },
            name: function () { return linkName },
            connect: connect,
            disconnect: disconnect,
            write: enqueue
        }
    }

    function isSimSource(source) {
        if (!source || !root.document) return false
        const frames = root.document.querySelectorAll("iframe[id^='sim-frame-']")
        for (let i = 0; i < frames.length; i++) {
            if (frames[i].contentWindow === source) return true
        }
        return false
    }

    function installBridge() {
        if (root.__mipBridge) {
            root.__mipBridge.show()
            return root.__mipBridge
        }
        const session = createSession()
        let gameFrame = null
        let panel = null

        function simWindow() {
            if (gameFrame) return gameFrame
            const frame = root.document.querySelector("iframe[id^='sim-frame-']")
            return frame ? frame.contentWindow : null
        }

        function postToGame(bytes) {
            const target = simWindow()
            if (!target) return
            try {
                target.postMessage({
                    type: "messagepacket",
                    channel: CHANNEL,
                    data: bytes
                }, "*")
            } catch (err) {
                gameFrame = null
            }
        }

        function statusPacket(isConnected, name) {
            const label = name || ""
            const out = new Uint8Array(2 + Math.min(label.length, 16))
            out[0] = OP_STATUS
            out[1] = isConnected ? 1 : 0
            for (let i = 0; i < out.length - 2; i++) out[i + 2] = label.charCodeAt(i) & 127
            return out
        }

        function setLabel(text) {
            const node = panel && panel.querySelector("[data-mip-status]")
            if (node) node.textContent = text
            const button = panel && panel.querySelector("[data-mip-connect]")
            if (button) button.textContent = session.isConnected() ? "Disconnect" : "Connect MiP"
        }

        session.onStatus(function (isConnected, name, error) {
            postToGame(statusPacket(isConnected, name))
            if (error) {
                const errors = {
                    1: "This browser cannot use Bluetooth",
                    2: "No robot was picked",
                    3: "Could not connect",
                    4: "Robot disconnected"
                }
                setLabel(errors[error] || "Connection problem")
                postToGame(new Uint8Array([OP_ERROR, error]))
                return
            }
            setLabel(isConnected ? (name || "Connected") : "Pick your MiP")
        })

        session.onNotify(function (bytes) {
            const packet = new Uint8Array(bytes.length + 1)
            packet[0] = OP_NOTIFY
            packet.set(bytes, 1)
            postToGame(packet)
        })

        function handleGame(bytes) {
            if (!bytes.length) return
            const op = bytes[0]
            if (op === OP_HELLO) {
                postToGame(statusPacket(session.isConnected(), session.name()))
            } else if (op === OP_DISCONNECT) {
                session.disconnect()
            } else if (op === OP_WRITE && bytes.length > 1) {
                session.write(bytes.slice(1))
            }
        }

        root.addEventListener("message", function (event) {
            const data = event.data
            if (!data || data.type !== "messagepacket" || data.channel !== CHANNEL) return
            if (!isSimSource(event.source)) return
            gameFrame = event.source
            handleGame(toBytes(data.data))
        })

        panel = root.document.createElement("div")
        panel.id = "mip-bridge-panel"
        panel.innerHTML = ""
            + "<strong>MiP</strong>"
            + "<p data-mip-status>Pick your robot</p>"
            + "<button type='button' data-mip-connect>Connect MiP</button>"
            + "<button type='button' data-mip-any>Other Bluetooth device</button>"
        panel.style.cssText = [
            "position:fixed",
            "right:16px",
            "bottom:16px",
            "z-index:100000",
            "width:220px",
            "padding:12px",
            "background:#1c1915",
            "color:#f4efe6",
            "font:14px/1.4 system-ui,sans-serif",
            "border-radius:12px",
            "box-shadow:0 10px 30px rgba(0,0,0,.28)"
        ].join(";")
        const buttons = panel.querySelectorAll("button")
        for (let i = 0; i < buttons.length; i++) {
            buttons[i].style.cssText = "display:block;width:100%;margin-top:8px;padding:8px;border:0;border-radius:8px;background:#e85d04;color:white;font:inherit;cursor:pointer"
        }
        panel.querySelector("[data-mip-any]").style.background = "#3f3a34"
        panel.querySelector("[data-mip-connect]").addEventListener("click", function () {
            if (session.isConnected()) session.disconnect()
            else session.connect(false)
        })
        panel.querySelector("[data-mip-any]").addEventListener("click", function () {
            session.connect(true)
        })
        if (root.document.body) root.document.body.appendChild(panel)
        else root.document.addEventListener("DOMContentLoaded", function () {
            root.document.body.appendChild(panel)
        })

        const api = {
            show: function () { panel.style.display = "block" },
            hide: function () { panel.style.display = "none" },
            session: session
        }
        root.__mipBridge = api
        return api
    }

    function shouldInstall() {
        if (!root.document || !root.location) return false
        const host = root.location.hostname || ""
        if (/(^|\.)makecode\.com$/i.test(host)) return true
        if (root.document.getElementById("simulators")) return true
        if (root.document.querySelector("iframe[id^='sim-frame-']")) return true
        return false
    }

    const api = {
        CHANNEL: CHANNEL,
        OP_HELLO: OP_HELLO,
        OP_DISCONNECT: OP_DISCONNECT,
        OP_WRITE: OP_WRITE,
        OP_STATUS: OP_STATUS,
        OP_ERROR: OP_ERROR,
        OP_NOTIFY: OP_NOTIFY,
        decodeNotification: decodeNotification,
        toBytes: toBytes,
        createSession: createSession,
        installBridge: installBridge
    }

    if (typeof module !== "undefined" && module.exports) module.exports = api
    root.MipBle = api

    if (typeof window !== "undefined" && shouldInstall()) installBridge()
})(typeof globalThis !== "undefined" ? globalThis : this)
