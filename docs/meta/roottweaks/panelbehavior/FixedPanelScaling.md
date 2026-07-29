# Fixed Panel Scaling

Locks or unlocks panel size adjustment. Requires a root shell.

Enter a root shell:

```console
adb shell
su
```

Enable panel scaling:

```console
oculuspreferences --setc panel_scaling true
am force-stop com.oculus.vrshell
```

Disable panel scaling:

```console
oculuspreferences --setc panel_scaling false
am force-stop com.oculus.vrshell
```

> [!NOTE]
> This persists across reboots and is safe to use.
