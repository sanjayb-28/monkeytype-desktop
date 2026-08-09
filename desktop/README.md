# Monkeytype Desktop for macOS

This directory packages the current Monkeytype frontend as a local-only macOS
application. It targets Apple Silicon and uses Tauri 2 with the system WKWebView.

## Product boundary

- Typing tests, result screens, themes, sounds, settings, and local activity run
  entirely on the Mac.
- Results, personal bests, and typing totals are stored in WebKit local storage.
- Accounts, cloud sync, leaderboards, ads, analytics, and remote text sources are
  excluded from the desktop build.
- The packaged webview has a restrictive Content Security Policy and no network,
  filesystem, updater, or shell plugin.

## Build

The upstream frontend currently requires Node.js 24 and pnpm.

```sh
pnpm --dir desktop build
```

The package script always builds for `aarch64-apple-darwin`. Outputs are written
under `desktop/src-tauri/target/aarch64-apple-darwin/release/bundle/`.

Local builds are ad-hoc signed. Public distribution still requires a Developer ID
certificate and Apple notarization credentials.
