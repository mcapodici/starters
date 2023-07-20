# Python install

(Reference: https://www.itsupportwale.com/blog/how-to-upgrade-to-python-3-11-on-ubuntu-20-04-and-22-04-lts/)

```
sudo add-apt-repository ppa:deadsnakes/ppa
sudo apt-get update
sudo apt-get install python3.11

# Not doing this as it stops terminal working in Ubuntu:
# Xsudo update-alternatives --install /usr/bin/python3 python3 /usr/bin/python3.10 1
# Xsudo update-alternatives --install /usr/bin/python3 python3 /usr/bin/python3.11 2
# Xsudo update-alternatives --config python3
# X2

sudo apt-get install python-is-python3
python3 -V
sudo apt install python3-pip
sudo apt-get install python3.11-venv
python3 -m pip install --user pipx
python3 -m pipx ensurepath

# new terminal to use pipx
# Not doing this as it doesn't seem to persist and hard to do again later and get it to work
# Xpipx install virtualenv
python3 -m pip install virtualenv

# for a project:
virtualenv nanoGPTonModal
source nanoGPTonModal/bin/activate




```
## Git

sudo apt-get install git-all
