# Hulk UI

Enables or disables the "Hulk UI" coloring. Requires a root shell.

Enter a root shell:

```console
adb shell
su
```

Enable Hulk UI:

```console
oculuspreferences --setc ocui_hulk_ui_enabled true
am force-stop com.oculus.vrshell
```

Disable Hulk UI:

```console
oculuspreferences --setc ocui_hulk_ui_enabled false
am force-stop com.oculus.vrshell
```

> [!NOTE]
> This persists across reboots and is safe to use.
