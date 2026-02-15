# Quest 3 / 3s Root Guide

To check if you can gain root access on your Quest 3 or 3s, run `adb shell getprop ro.build.version.incremental`

If the number that appears is **HIGHER** than these numbers, **you CANNOT root** at this point in time.

* Panther|Quest 3s `1176880085300610` (79.0.0.1187.593.767170732)

* Eureka|Quest 3 `51154110129000520` (79.0.0.1239.593.774348660)

---
# Event Horizon

[Event Horizon](https://github.com/veygax/EventHorizon) is an app thats automatically roots on boot and installs Magisk.

Things you can do with Event Horizon:
*  Root
*  Edit select preferences
*  Over/Under clock CPU or GPU
*  Disable auto installing default Apps
*  Custom Utilities

## How to install   
Go to the [Event Horizon](https://github.com/veygax/EventHorizon/releases/latest) Github and download the eventhorizon.apk file

Use any way to install apk files to the device. Sidequest, ADB Shell, etc

Then, open the app in the device, press root, and wait.

The headset should reboot when done

Happy Rooting!

---
# Command Line


Make sure you have a quest 3 or 3s (IT WILL NOT WORK ON OTHER DEVICES!) and you also need adb (android debug bridge) **THIS IS NOT FOR THE END USER**

**Options:**
- Choose to disable SELinux, gain root, both, or install Magisk with both.
- Optionally dump the kernel image.
- Optionally launch a shell with toybox nc (`localhost:1234`)

Now lets get started

