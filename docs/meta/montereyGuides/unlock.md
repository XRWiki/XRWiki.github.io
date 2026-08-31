# Unlocking the Oculus Quest

Thanks to the modern ionstack exploit and research done by starseed, darknight1050 a nd ender8492, the bootloader of the oculus quest can now be unlocked!.

The 2 main methods of unlocking is using QuestStack (PC only) or quest1-unlock (web based).


## Requirements

* Oculus Quest with [dev mode enabled](https://developers.meta.com/horizon/documentation/native/android/mobile-device-setup/)

## Unlocking with QuestStack

QuestStack is an unlock tool for Windows, MacOS and Linux based devices allowing you to unlock your quest

Download it from [here](https://github.com/starseed12345/QuestStack/releases/latest), selecting the version for your operating system

Extract and open the tool
![QuestStack.png](../../assets/images/monterey/QuestStack.png)

Connect your headset and select "Check ADB", make sure to accept any prompts your headset shows.

You can then press start and follow the instructions

## Unlocking with quest1-unlock
quest1-unlock is a web based tool allowing you to unlock your quest with a webUSB compatible browser

Connect your headset to your pc and go to the website for the tool located [here](https://quest1-unlock.skystate.ch/)

![Screenshot 2026-08-31 at 16.48.56.png](../../assets/images/monterey/Screenshot%202026-08-31%20at%2016.48.56.png)
Press connect headset and select your headset from the list, if you get a permission error or similar, make sure adb is not running on your main pc with `adb kill-server`

The instructions will guide you through the unlock process