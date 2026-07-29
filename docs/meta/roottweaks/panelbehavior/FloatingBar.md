# Floating Bar

Enables or disables the floating bar that appears under apps. Requires a root shell.

> [!WARNING]
> Does not work on the latest rootable version.

Enter a root shell:

```console
adb shell
su
```

**Disable** the floating bar under app:

> [!NOTE]
> Command depends on your headset's OS version.

v77 and above:
```console
pm disable-user --user 0 com.oculus.vrshell/com.oculus.panelapp.controlbar.ControlBarActivity
```

Below v77:
```console
pm disable-user --user 0 com.oculus.vrshell/com.oculus.panelapp.controlbar.ControlBarPanelService
```

**Re-enable** the floating bar under app:

v77 and above:
```console
pm enable com.oculus.vrshell/com.oculus.panelapp.controlbar.ControlBarActivity
```

Below v77:
```console
pm enable com.oculus.vrshell/com.oculus.panelapp.controlbar.ControlBarPanelService
```

> [!NOTE]
> This persists across reboots and is safe to use.
