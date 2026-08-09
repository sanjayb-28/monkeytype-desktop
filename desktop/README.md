# Monkeytype Desktop for macOS

This directory packages the current Monkeytype frontend as a local-only macOS
application. It targets Apple Silicon and uses Tauri 2 with the system WKWebView.

## Product boundary

- Typing tests, result screens, themes, sounds, settings, and local activity run
  entirely on the Mac.
- Results, personal bests, and typing totals are stored without a history cap in
  the app's IndexedDB database. Existing local-storage data is migrated
  automatically.
- Accounts, cloud sync, leaderboards, ads, analytics, and remote text sources are
  excluded from the desktop build.
- The packaged webview has a restrictive Content Security Policy and no network,
  updater, or shell plugin. Native file access is limited to files explicitly
  selected through the macOS open/save panels.
- Versioned backups include history, personal bests, settings, custom fonts, and
  custom backgrounds. Backups are validated before restore.

## Build

The upstream frontend currently requires Node.js 24 and pnpm.

```sh
pnpm --dir desktop build
```

The package script always builds for `aarch64-apple-darwin`. Outputs are written
under `desktop/src-tauri/target/aarch64-apple-darwin/release/bundle/`.

Local builds are ad-hoc signed. Pull requests build and verify an Apple Silicon
app and DMG on an ARM64 GitHub runner. The WebView content policy blocks remote
connections, and the desktop build removes accounts, cloud APIs, ads, analytics,
telemetry, and update checks. Public distribution still requires a Developer ID
certificate and Apple notarization credentials; do not publish the CI artifact
as a public release until those credentials are configured.
