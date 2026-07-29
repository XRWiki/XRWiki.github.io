# Rebootless UI Switching

Toggle between the Navigator and Dock UI without rebooting. Requires a root shell.

> [!WARNING]
> Does not work on the latest rootable version.

Enter a root shell:

```console
adb shell
su
```

Enable Dock UI (dimmed if the navigator panel is open):

```console
oculuspreferences --setc debug_navigator_state 0
am force-stop com.oculus.vrshell
```

Enable Navigator UI:

```console
oculuspreferences --setc debug_navigator_state 1
am force-stop com.oculus.vrshell
```

> [!NOTE]
> This persists across reboots and is safe to use.
