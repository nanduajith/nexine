# Icons

Tauri needs platform icon files here before a desktop build. Generate them from a
single source image (1024×1024 PNG recommended) with:

```bash
pnpm tauri icon path/to/nexine-logo.png
```

This produces `32x32.png`, `128x128.png`, `128x128@2x.png`, `icon.icns`, and `icon.ico`
(the files referenced in `tauri.conf.json`). They are intentionally not committed as
binaries; run the command once before packaging.
