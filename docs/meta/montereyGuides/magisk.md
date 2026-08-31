# Rooting after unlock

## Requirements 
* Unlocked Bootloader
* android-bootloader-extractor (Magisk only)
* The image of your current firmware from [cocaine.trade](https://cocaine.trade/Quest_firmware) (Magisk only)

## Rooting without Magisk

Once the bootloader is unlocked, while you are still in fastboot, run the following commands...

```shell
fastboot oem set-appended-cmdline androidboot.adb.rootable=1
fastboot oem set-enable-adb-on-retail 1
```
> [!CAUTION]
> If you ever need to relock your bootloader for whatever reason, you MUST unset these otherwise you will brick your headset!!!

To undo this you can run the following...

```shell
fastboot oem set-appended-cmdline
fastboot oem set-enable-adb-on-retail 0
```
## Rooting with Magisk

Rooting with Magisk gives you access to multiple features commonly found on rooted phones such as

* Access control for root
* Zygisk
* Magisk Modules

Rooting with Magisk requires you to patch your firmware's boot.img 

First you need to download singularity-Magisk [from here](https://github.com/Lumince/singularity-Magisk/releases/latest), this is because the original Magisk has some issues with Zygisk on the Quests

Next, you will need to extract the boot.img from your target firmware, to find your incremental version run this

```shell
adb shell getprop ro.build.version.incremental
```

You can then find your firmware on [cocaine trade](https://cocaine.trade/Quest_firmware)  
    
To extract your firmware, run 
```shell
android-ota-payload-extractor [your firmware.zip] boot
```

or drag and drop your firmware onto the extractor's executable.

This will give you your `boot.img`

push this file to your quest and install magisk

```shell
adb push boot.img /sdcard/
adb install singularity-Magisk.apk
```

Open magisk and select install, patch file, then choose your boot.img

Once patching has completed, pull the file back to your quest

```shell
adb pull /sdcard/Download/magisk_patched_[random_strings].img
```
> [!NOTE]
> You can use your TAB key to autocomplete the results.

### Testing the compiled boot img

you will need to test out your boot.img file to make sure that it functions correctly.

boot into fastboot with `adb reboot bootloader` and execute the following command

```shell
fastboot boot magisk_patched_[random_strings].img
```



Next is to figure out your boot slot, boot into fastboot with `adb reboot bootloader`, Then select device info, note down your "active slot" and exit out of that menu

You can run this command to flash Magisk

```shell
fastboot flash boot_[active slot] magisk_patched_[random_strings].img
```
