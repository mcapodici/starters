Steps to set up a fresh Hetzner Cloud Ubuntu box to run an agent (e.g. [herdr](https://herdr.dev)).

## 1. Create the server

* Create a new Cloud server in the Hetzner Console, Ubuntu image.
* On the Networking step you'll be asked about IPv4/IPv6. You can opt out of a public IPv4 to save a small monthly fee and keep IPv6 only, **but** that also removes general outbound IPv4 internet access, not just inbound. Since a lot of the internet (e.g. github.com) is IPv4-only, this breaks things like `curl`, `apt`, and installer scripts that pull from GitHub.
  * If that happens, fix it without recreating the server: Console → server → **Networking** tab → assign a Primary IPv4. No shutdown needed — then run `sudo networkctl renew eth0` (or `sudo systemctl restart systemd-networkd` if that doesn't pick it up) to get the new default route.
  * Simplest option: just keep the public IPv4 enabled at creation time and skip the above.

## 2. Set up a user

See [server.md](./server.md) for creating a sudo user with SSH key access.

## 3. Install herdr

```bash
curl -fsSL https://herdr.dev/install.sh | sh
```

## 4. Add the install path to PATH

The installer puts the binary in `~/.local/bin`, which isn't on `PATH` by default. Add it to your shell config and reload:

```bash
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

(Use `~/.zshrc` instead if your shell is zsh — check with `echo $SHELL`.)

Verify:

```bash
herdr --version
```

Log out of SSH and start new session this way:

```
herdr --remote you@yourserver
```

## 5. Mise

```
curl https://mise.run | sh
```

Then do the suggested:

```
echo "eval \"\$(/home/YOUR_USER_NAME/.local/bin/mise activate bash)\"" >> ~/.bashrc
```

## 6. Node

```
mise use --global node@26
```

## 7. Tooling

E.g. atomic https://github.com/bastani-inc/atomic#get-started

```
npm install -g @bastani/atomic
atomic
```

Then

```
/login
```

Then watch https://www.youtube.com/live/XPQaoEZa9Y4 to figure out how to use that!




