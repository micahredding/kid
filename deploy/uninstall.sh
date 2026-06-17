#!/usr/bin/env bash
#
# Stop and remove the kid-games LaunchAgent.
#
set -euo pipefail

LABEL="com.micahredding.kidgames"
PLIST="$HOME/Library/LaunchAgents/$LABEL.plist"

launchctl unload "$PLIST" 2>/dev/null || true
rm -f "$PLIST"
echo "Removed $LABEL (the repo and its files are untouched)."
