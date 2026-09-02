# Quest Root Guide

> [!NOTE]
> Singularity below is the current, all-in-one method and covers Quest 2, Pro, 3 and 3s. Confirmed working as of the builds below — run `adb shell getprop ro.build.version.incremental` to check yours. A higher number may still work, it just hasn't been confirmed yet.
> * Panther|Quest 3s `3697600027800610` (206.0.0.133.1332.1026601864)
> * Eureka|Quest 3 `52345320035400520` (206.0.0.133.1332.1026601864)
> * Seacliff|Quest Pro `51483620027600340` (206.0.0.132.1332.1026289179)
> * Hollywood|Quest 2 `52222680028100150` (206.0.0.133.1332.1026601864)

---
# Singularity

[Singularity](https://github.com/Lumince/singularity) is an all-in-one root app for Meta headsets, built on the [Pancake](https://pancake.cbjn.dev/) (ionstack) exploit. Supports Quest 2, Pro, 3 and 3s. Rooting can take a few tries — if it fails partway, power the headset off and on and try again.

## How to install
Download the latest APK from [Singularity](https://github.com/Lumince/singularity/releases/latest), then sideload it with the `-g` flag — it grants the `WRITE_SECURE_SETTINGS` permission Singularity needs to turn on Wireless ADB itself:
```console
adb install -g Singularity.apk
```

## Rooting
1. Set up Wireless ADB from inside the app.
2. Press **Root Now**. If it stops partway and the button is no longer greyed out, press it again.
3. Once root is gained the headset soft-reboots on its own — don't press Root Now again after that.
4. Check Unknown Sources for an app called **Singularity-Magisk**. If it's there, open it, grant Singularity root access in the Super User tab, then close and reopen Singularity.

## Features
- Root-on-boot
- Root terminal
- Internet kill switch and domain blocker
- Wireless ADB setup
- Frida-Server
- Zygisk fix for Meta's changes
- Auto-accepts the USB notification for MTP access
- Meta telemetry disabling
- No-controller requirement
- OS update monitoring, to un-queue forced updates
- Build type spoofing (user / userdebug / eng)
- CPU/GPU monitoring and config
- App manager — install, uninstall, launch
- Loft installation, for devices missing that environment
- Eye calibration launcher (Quest Pro)
- Fix Controllers, for controllers that stop working after root
- UI switching (Dock UI / Nav UI)
- Service.jar patching — uninstall or disable protected system apps

Credit to the [ionstack](https://github.com/NebuSec/CyberMeowfia/tree/main) source it's built on, [topjohnwu](https://github.com/topjohnwu) and the Magisk developers, and Beom & Darknight for their Pancake (ionstack Quest port) work.

Happy rooting!

---
# Command Line (legacy)

**THIS IS NOT FOR THE END USER.** Singularity above is built on this same exploit and is what almost everyone should use instead. This is that exploit run by hand — kept here for anyone who wants a raw root shell without installing an app.

> [!CAUTION]
> Rooting a Quest 3/3s this way is genuinely dangerous: a bad write to the bootloader or `/system` partition can permanently hard-brick the headset, and Meta withholds the keys needed to recover it via EDL. **Never press Magisk's own Install button** — use the Magisk build packaged with the exploit release, which hides it. Back up your account's `deviceKey`, `MetaProfileGenericAuthMap` and Meta User ID first — see the [Private Quest guide](meta/PrivateQuestGuide.md) — so you have a way back from a soft brick.

This is [FreeXR](https://github.com/FreeXR/eureka_panther-adreno-gpu-exploit-1)'s exploit for a memory-corruption vulnerability in the Adreno GPU driver on Eureka/Panther (Quest 3/3s only), responsibly disclosed as CVE-2025-21479. It reads and writes arbitrary kernel memory to disable SELinux and escalate to root.

> [!WARNING]
> This only works up to the builds below — anything higher is patched. Meta's efuses mean **you cannot downgrade past this point**, so check first.
> * Panther|Quest 3s `1176880085300610` (79.0.0.1187.593.767170732)
> * Eureka|Quest 3 `51154110129000520` (79.0.0.1145.506.774349433)

Options built into the exploit:
- Disable SELinux, gain root, both, or install Magisk with both.
- Optionally dump the kernel image.
- Optionally launch a shell with toybox nc (`localhost:1234`)

Download the [exploit](https://github.com/FreeXR/eureka_panther-adreno-gpu-exploit-1/releases/latest), then run these in this exact order.

Disable OTA updates first, so an update can't patch the exploit out from under you:
```console
adb shell pm disable-user --user 0 com.oculus.updater
```

Push the exploit to the device:
```console
adb push exploit /data/local/tmp
```

Then run it:
```console
adb shell
chmod +x /data/local/tmp/exploit/exploit
/data/local/tmp/exploit/exploit
```

This gives you a root shell that lasts until the next reboot.
