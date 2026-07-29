# Infinite Floating Panels

Toggles unlimited floating panels. Requires a root shell.

Enter a root shell:

```console
adb shell
su
```

Enable:

```console
oculuspreferences --setc debug_infinite_spatial_panels_enabled true
am force-stop com.oculus.vrshell
```

Disable:

```console
oculuspreferences --setc debug_infinite_spatial_panels_enabled false
am force-stop com.oculus.vrshell
```

> [!NOTE]
> This persists across reboots and is safe to use.
