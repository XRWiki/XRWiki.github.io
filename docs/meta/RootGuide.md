# Quest 3 / 3s Root Guide

> [!NOTE]
> To check if you can gain root access on your Quest 3 or 3s, run `adb shell getprop ro.build.version.incremental`
> If the number that appears is **HIGHER** than these numbers, **you CANNOT root** at this point in time.
> * Panther|Quest 3s `1176880085300610` (79.0.0.1187.593.767170732)
> * Eureka|Quest 3 `51154110129000520` (79.0.0.1239.593.774348660)

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

**THIS IS NOT FOR THE END USER**

Options:
- Choose to disable SELinux, gain root, both, or install Magisk with both.
- Optionally dump the kernel image.
- Optionally launch a shell with toybox nc (`localhost:1234`)

Now lets get started.

Download for [exploit](https://github.com/FreeXR/eureka_panther-adreno-gpu-exploit-1/releases/latest)

For the first thing, DISABLE OTA UPDATES! (This is needed so you cant get updates that patches the exploit)

`adb shell pm disable-user --user 0 com.oculus.updater`
Run this first

`adb push exploit /data/local/tmp`
Then run this

And finally that
```
adb shell
chmod +x /data/local/tmp/exploit/exploit
data/local/tmp/exploit/exploit
```
In this exact order, this will run the exploit, temporarily allowing you access to a root shell until a reboot.