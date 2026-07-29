# Navigator Background Fog

Toggles the background fog effect in Navigator. Requires a root shell.

> [!WARNING]
> Does not work on the latest rootable version.

Enter a root shell:

```console
adb shell
su
```

Enable background fog:

```console
oculuspreferences --setc navigator_background_disabled false
am force-stop com.oculus.vrshell
```

Disable background fog:

```console
oculuspreferences --setc navigator_background_disabled true
am force-stop com.oculus.vrshell
```

> [!NOTE]
> This persists across reboots and is safe to use.
