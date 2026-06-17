#!/usr/bin/env bash
#
# Install the kid-games hub as a per-user LaunchAgent on this Mac.
# Runs `node kid/server.mjs` at login, auto-restarts if it crashes.
# Host-agnostic: detects node + repo location on whatever mini you run it on.
# No sudo required.
#
set -euo pipefail

LABEL="com.micahredding.kidgames"
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
NODE="$(command -v node || true)"
PLIST="$HOME/Library/LaunchAgents/$LABEL.plist"
HOSTN="$(scutil --get LocalHostName 2>/dev/null || hostname -s)"

if [ -z "$NODE" ]; then
  echo "Error: 'node' not found in PATH." >&2
  echo "Install it first, e.g.:  brew install node   then re-run this script." >&2
  exit 1
fi

mkdir -p "$HOME/Library/LaunchAgents"
mkdir -p "$REPO_ROOT/kid/logs"

cat > "$PLIST" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>            <string>$LABEL</string>
  <key>ProgramArguments</key>
  <array>
    <string>$NODE</string>
    <string>$REPO_ROOT/kid/server.mjs</string>
  </array>
  <key>WorkingDirectory</key>   <string>$REPO_ROOT</string>
  <key>RunAtLoad</key>          <true/>
  <key>KeepAlive</key>          <true/>
  <key>StandardOutPath</key>    <string>$REPO_ROOT/kid/logs/launchd-stdout.log</string>
  <key>StandardErrorPath</key>  <string>$REPO_ROOT/kid/logs/launchd-stderr.log</string>
</dict>
</plist>
EOF

# Reload if already installed, otherwise load fresh.
launchctl unload "$PLIST" 2>/dev/null || true
launchctl load -w "$PLIST"

echo "Installed and started: $LABEL"
echo "  node:    $NODE"
echo "  repo:    $REPO_ROOT"
echo "  logs:    $REPO_ROOT/kid/logs/launchd-*.log"
echo ""
echo "Play from any device on the network at:"
echo "  http://$HOSTN.local:3131/"
