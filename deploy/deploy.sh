#!/usr/bin/env bash
#
# Pull the latest from GitHub and restart the running hub.
# Run this on the mini whenever you've pushed changes from your dev machine.
#
set -euo pipefail

LABEL="com.micahredding.kidgames"
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
HOSTN="$(scutil --get LocalHostName 2>/dev/null || hostname -s)"

cd "$REPO_ROOT"
echo "Pulling latest from origin..."
git pull --ff-only

echo "Restarting $LABEL..."
launchctl kickstart -k "gui/$(id -u)/$LABEL"

echo "Done. Serving at http://$HOSTN.local:3131/"
