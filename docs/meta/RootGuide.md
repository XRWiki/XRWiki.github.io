# Quest 3 / 3s Root Guide

To check if you can gain root access on your Quest 3 or 3s, run `adb shell getprop ro.build.version.incremental`

If the number that appears is **HIGHER** than these numbers, **you CANNOT root** at this point in time.

* Panther|Quest 3s `1176880085300610` (79.0.0.1187.593.767170732)

* Eureka|Quest 3 `51154110129000520` (79.0.0.1239.593.774348660)

---
# Event Horizon

[Event Horizon](https://github.com/Luminacy/EventHorizon) is an app thats automatically roots on boot and installs Magisk.

Things you can do with Event Horizon:
*  Disable auto installing default Apps
*   Edit select preferences
*   Over/Under clock CPU or GPU
*   
*   
*   

## How to install   


---
# Command Line


Make sure you have a quest 3 or 3s (IT WILL NOT WORK ON OTHER DEVICES!) and you also need adb (android debug bridge) **THIS IS NOT FOR THE END USER**

**Options:**
- Choose to disable SELinux, gain root, both, or install Magisk with both.
- Optionally dump the kernel image.
- Optionally launch a shell with toybox nc (`localhost:1234`)

Now lets get started

