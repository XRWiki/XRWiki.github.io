# Disabling Updates Guide
Make sure you have automatic updates in settings disabled before doing any of these. Meta easily bypasses this but it works as an extra layer of security.
## Disabling the updater package
This method is patched but will work on headsets on <v81 and early builds of v81
1. Open an ADB Shell
2. Run `adb shell pm disable-user --user 0 com.oculus.updater`

If successful, this should output `"Package com.oculus.updater new state: disabled-user"`
## Blocking Meta Domains (Network Level)
Use pi-hole or something similar to block the domains below:
https://raw.githubusercontent.com/veygax/eventhorizon/refs/heads/main/hosts
## Blocking with EventHorizon
EventHorizon automatically blocks OTA updates upon rooting, however it also has a Meta Domain Blocker built into it that can you enable. If you don't have a rootable headset, this will just block internet entirely.
For more info on EventHorizon, check out it's [page](meta/RootGuide.md)
