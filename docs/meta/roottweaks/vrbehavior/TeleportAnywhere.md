# Teleport Anywhere

Removes teleport restrictions in the home environment. Requires a root shell.

> [!WARNING]
> Does not work on the latest rootable version.

Enter a root shell:

```console
adb shell
su
```

Disable the teleport limit:

```console
oculuspreferences --setc shell_teleport_anywhere true
```

Re-enable the teleport limit:

```console
oculuspreferences --setc shell_teleport_anywhere false
```

> [!NOTE]
> This persists across reboots and is safe to use.
