# Python install

(Reference: https://www.itsupportwale.com/blog/how-to-upgrade-to-python-3-11-on-ubuntu-20-04-and-22-04-lts/)

```
sudo add-apt-repository ppa:deadsnakes/ppa
sudo apt-get update
sudo apt-get install python3.11

# !! Don't use update-alternatives with python it will fuck up your shell etc. !!

sudo apt-get install python-is-python3
sudo apt install python3-pip
python3 -m pip install --user pipx
python3 -m pipx ensurepath

# new terminal to use pipx
# Not doing this as it doesn't seem to persist and hard to do again later and get it to work
# Xpipx install virtualenv
python3 -m pip install virtualenv

# for a project:
virtualenv nanoGPTonModal
source nanoGPTonModal/bin/activate

# todo: if needed I will add stuff about multiple versions of python


```
## Git

sudo apt-get install git-all
