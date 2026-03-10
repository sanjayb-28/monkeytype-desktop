# Monkeytype Desktop

A native desktop typing test app built with [Tauri 2](https://tauri.app), based on [Monkeytype](https://monkeytype.com).

Fully local — no account, no server, no tracking.

⭐ **Please leave a star if you like the app!**

## Install (macOS)

```bash
brew tap sanjayb-28/monkeytype
brew install --cask monkeytype
```

### Manual Install

[Download the DMG](https://github.com/sanjayb-28/monkeytype-desktop/releases/latest/download/Monkeytype_0.1.0_aarch64.dmg), drag to Applications, then run `xattr -cr /Applications/Monkeytype.app` in Terminal.

> **Note:** Since the app isn't signed with an Apple Developer certificate ($99/year), macOS will show a security warning when you first try to open it. The terminal command above removes the quarantine flag so the app opens normally.


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
