# Monkeytype Desktop

A native desktop typing test app built with [Tauri 2](https://tauri.app), based on [Monkeytype](https://monkeytype.com).

Fully local — no account, no server, no tracking.

⭐ **Please leave a star if you like the app!**

## Download (macOS)

| File | Description |
|------|------------|
| [Monkeytype_0.1.0_aarch64.dmg](https://github.com/sanjayb-28/monkeytype-desktop/releases/latest/download/Monkeytype_0.1.0_aarch64.dmg) | macOS Apple Silicon |

### Installation Instructions

Since the app isn't signed with an Apple Developer certificate, macOS will block it. To install:

1. Download and mount the `.dmg` file
2. **Right-click** the app and select **Open** (not double-click)
3. Click **Open** in the dialog that appears

Or use Terminal to remove the quarantine flag:
```bash
xattr -d com.apple.quarantine /Applications/Monkeytype.app
```


## Development

```bash
pnpm install
pnpm tauri dev
```

## Build

```bash
pnpm tauri build
```


## Tech Stack

- **Tauri 2** — native shell
- **Vite** — bundler
- **SolidJS** — UI framework
- **TypeScript** — language

## License

Based on [monkeytype/monkeytype](https://github.com/monkeytype/monkeytype). See original repo for license.
