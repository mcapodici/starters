# Stop Notification Bounce

If icons jump repeatedly because they want attention, you can stop it via Terminal:

```
defaults write com.apple.dock no-bouncing -bool TRUE
killall Dock
```
