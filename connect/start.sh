#!/usr/bin/env bash
# Serve the MiP connect page and open a browser with Web Bluetooth switched on.
set -euo pipefail

cd "$(dirname "$0")"

PORT="${PORT:-8000}"
URL="http://127.0.0.1:${PORT}/"

if ! curl -s -o /dev/null --max-time 1 "$URL"; then
    setsid python3 -m http.server "$PORT" >/tmp/mip-connect-server.log 2>&1 </dev/null &
    SERVER_PID=$!
    for _ in 1 2 3 4 5 6 7 8 9 10; do
        if curl -s -o /dev/null --max-time 1 "$URL"; then break; fi
        sleep 0.3
    done
    if ! curl -s -o /dev/null --max-time 1 "$URL"; then
        echo "Could not start the web server on port $PORT." >&2
        echo "Run it yourself with: python3 -m http.server $PORT" >&2
        exit 1
    fi
    echo "Serving $URL (pid $SERVER_PID)"
else
    echo "Already serving $URL"
fi

BROWSER=""
for name in google-chrome google-chrome-stable chromium-browser chromium microsoft-edge brave-browser; do
    if command -v "$name" >/dev/null 2>&1; then
        BROWSER="$name"
        break
    fi
done

if [ -z "$BROWSER" ]; then
    echo "No Chrome, Chromium, Edge or Brave found." >&2
    echo "Open $URL in Chrome with this flag: --enable-features=WebBluetooth" >&2
    exit 1
fi

RUNNING=""
case "$BROWSER" in
    google-chrome*) RUNNING_PATTERN="google-chrome|/opt/google/chrome/chrome" ;;
    chromium*)       RUNNING_PATTERN="chromium" ;;
    microsoft-edge*) RUNNING_PATTERN="microsoft-edge|/opt/microsoft/msedge" ;;
    brave*)          RUNNING_PATTERN="brave" ;;
    *)               RUNNING_PATTERN="" ;;
esac
if [ -n "$RUNNING_PATTERN" ] && pgrep -f "$RUNNING_PATTERN" >/dev/null 2>&1; then
    RUNNING=1
fi

FLAGS=(--enable-features=WebBluetooth --no-first-run --no-default-browser-check)

if [ -n "$RUNNING" ]; then
    PROFILE_DIR="${XDG_CACHE_HOME:-$HOME/.cache}/mip-connect-browser"
    mkdir -p "$PROFILE_DIR"
    echo "A browser is already running, so this opens a separate window profile"
    echo "($PROFILE_DIR) where the flag can take effect."
    echo "Quit every browser window and re-run this script to use your normal profile."
    exec "$BROWSER" "${FLAGS[@]}" --user-data-dir="$PROFILE_DIR" "$URL"
fi

echo "Opening $BROWSER with Web Bluetooth enabled."
exec "$BROWSER" "${FLAGS[@]}" "$URL"
