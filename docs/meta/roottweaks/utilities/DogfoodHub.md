# Dogfood Hub

There's not much you can do in this panel, but it's neat to see. Requires a root shell.

Enter a root shell:

```console
adb shell
su
```

First, enable DeviceConfig overrides:

```console
magisk resetprop ro.build.type userdebug
stop
start
```

Wait for the device to restart, then set the override to trusted user:

```console
am broadcast -a oculus.intent.action.DC_OVERRIDE --esa config_param_value oculus_systemshell:oculus_is_trusted_user:true
stop
start
```

After the restart, a new app called "Dogfood hub" should appear. If it doesn't show up, launch it manually:

```console
am start com.oculus.vrshell/com.oculus.panelapp.dogfood.DogfoodMainActivity
```
