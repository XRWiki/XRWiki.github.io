# Replace Report Keybind

Switches the report menu's keybind to open the dock library instead. Requires a root shell.

Enter a root shell:

```console
adb shell
su
```

Switch the report menu to the dock library:

```console
pm disable-user --user 0 com.oculus.systemux/com.oculus.panelapp.bugreporter.BugReporterActivity
```

Revert the switch:

```console
pm enable com.oculus.systemux/com.oculus.panelapp.bugreporter.BugReporterActivity
```

> [!NOTE]
> This persists across reboots and is safe to use.
