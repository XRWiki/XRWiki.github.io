# No Controller Requirement

Toggles whether VR apps can be joined with or without controllers. Requires a root shell.

Enter a root shell:

```console
adb shell
su
```

Disable the controller requirement:

```console
oculuspreferences --setc vrshell_skip_launchcheck_requires_controllers_enabled true
```

Re-enable the controller requirement:

```console
oculuspreferences --setc vrshell_skip_launchcheck_requires_controllers_enabled false
```

> [!NOTE]
> This persists across reboots and is safe to use.
