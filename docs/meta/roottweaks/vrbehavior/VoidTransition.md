# Void Transition

Toggle between the Immersive transition and the Void transition. Requires a root shell.

> [!WARNING]
> Does not work on the latest rootable version.

Enter a root shell:

```console
adb shell
su
```

Enable Immersive Transition:

```console
oculuspreferences --setc shell_immersive_transitions_enabled true
am force-stop com.oculus.vrshell
```

Enable Void Transition:

```console
oculuspreferences --setc shell_immersive_transitions_enabled false
am force-stop com.oculus.vrshell
```

> [!NOTE]
> This does **not** persist across reboots, but is safe to use.
