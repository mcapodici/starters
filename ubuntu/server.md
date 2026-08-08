If running a server some useful tools:

* https://goaccess.io/ (sudo apt-get install goaccess) - this is amazing. You get good log analytics from NGINX (etc..) logs but also realtime view.

## Adding a new sudo user with SSH access

Run as root (or an existing sudo user):

```bash
adduser newusername
```

This prompts for a password and optional info - you can just hit Enter through the optional fields.

Add it to sudoers (Ubuntu's `sudo` group is pre-wired to sudoers):

```bash
usermod -aG sudo newusername
```

Verify with `groups newusername`.

### SSH access

Password login (simpler, less secure) - make sure `PasswordAuthentication yes` is set in `/etc/ssh/sshd_config`, then just SSH in with the password:

```bash
ssh newusername@your-server-ip
```

SSH key (recommended) - from your local machine:

```bash
ssh-copy-id -i ~/.ssh/id_ed25519.pub newusername@your-server-ip
```

Or manually on the server:

```bash
mkdir -p /home/newusername/.ssh
nano /home/newusername/.ssh/authorized_keys   # paste the public key
chown -R newusername:newusername /home/newusername/.ssh
chmod 700 /home/newusername/.ssh
chmod 600 /home/newusername/.ssh/authorized_keys
```

Test before locking anything down:

```bash
ssh newusername@your-server-ip
sudo whoami   # should print "root"
```

Once the new user works, consider hardening: set `PermitRootLogin no` and (if using keys) `PasswordAuthentication no` in `/etc/ssh/sshd_config`, then `systemctl restart sshd`.
