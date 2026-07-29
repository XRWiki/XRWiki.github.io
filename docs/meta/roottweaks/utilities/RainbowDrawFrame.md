# Rainbow Draw Frame

Makes your headset screen flash rainbow colors. Requires shell access.

Enter the shell:

```console
adb shell
```

The rainbow loop:

```console
while true; do draw_frame -r 255 & p=$!; sleep 1; kill $p; draw_frame -g 255 & p=$!; sleep 1; kill $p; draw_frame -b 255 & p=$!; sleep 1; kill $p; done
```

Exit the loop:

```console
(ctrl + c)
draw_frame
(ctrl + c)
```

> [!NOTE]
> This does not persist across reboots and is safe to use. If the frame is still stuck after exiting the loop, exit again - but skip the first key combo.
