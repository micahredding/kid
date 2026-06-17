# Deploying the kid-games hub to a Mac mini

The hub (`kid/server.mjs`) serves the terminal app and all the games to every
device on the local network, and captures session logs. These scripts set it up
to run permanently on a Mac mini as a per-user **LaunchAgent** — it starts at
login and auto-restarts if it ever crashes. No `sudo` required.

The scripts are host-agnostic: they detect `node` and the repo location on
whatever machine you run them on, so the same files work on mini1 or mini4.

## One-time setup (on the mini)

```bash
# 1. Make sure Node is installed
node --version || brew install node

# 2. Clone the repo (anywhere you like)
git clone git@github.com:micahredding/kid.git
cd kid

# 3. Install + start the service
deploy/install.sh
```

That's it. The installer prints the play URL, which will be:

```
http://<mini-hostname>.local:3131/
```

e.g. `http://mini1.local:3131/`. Any device on the same network can open it.

## Updating after you push changes

Develop on any machine, `git push`, then on the mini:

```bash
deploy/deploy.sh        # git pull --ff-only + restart the service
```

## Managing the service

```bash
launchctl list | grep kidgames                       # is it running?
launchctl kickstart -k gui/$(id -u)/com.micahredding.kidgames   # restart
tail -f kid/logs/launchd-stderr.log                  # watch for errors
deploy/uninstall.sh                                  # stop + remove the agent
```

## Notes

- **Port:** 3131 (in `kid/server.mjs`).
- **Reachability:** uses Bonjour (`*.local`). If a device can't resolve it, use
  the mini's IP instead — find it with `ipconfig getifaddr en0` on the mini.
- **Logs & drawings** are written under `kid/logs/` and `kid/prints/` on the
  mini. Both are gitignored, so they accumulate locally and never conflict with
  `git pull`.
- **Foreground testing:** to run it by hand without the service, just
  `node kid/server.mjs` (Ctrl-C to stop).
