# Design QA

## Scope

- Reference: Monkeytype web v26.32.0, including the signed-in account page.
- Implementation: macOS Apple Silicon offline desktop build v0.4.3.
- Compared at 1280 x 720 for typing and settings, 1680 x 912 for the signed-in/local profile flow, and the native maximized app size on the current display.

## Fidelity review

- Typing: the original test configuration, word field, caret, typography, spacing, restart affordance, animations, and command-line hint are preserved. Removing the web merch strip shifts the desktop content upward by the height of that ad, as intended.
- Settings: the original groups, search, controls, theme grid, typography, spacing, icons, active states, and responsive layout are preserved. Online account guidance is omitted. The local-background control uses the same setting surface.
- Profile/dashboard: the original `UserProfile`, personal-best cards, activity calendar, filters, charts, statistics, and result table are used. Cloud leaderboards and public-profile actions are replaced by local backup actions.
- Tokens and assets: the desktop uses the original theme definitions, Atkinson Hyperlegible font stack, Font Awesome icons, spacing, radii, and color variables. No substitute CSS or SVG artwork was introduced.
- Resilience and accessibility: the inherited responsive grids, semantic controls, focus treatment, keyboard navigation, reduced-motion behavior, tooltips, and empty states remain intact. The native window launches maximized and can be unmaximized, moved, and resized normally.

## Interaction verification

- Switched from Serika Dark to Dracula; the main/background tokens changed to `#bd93f9` / `#282a36` and remained identical after reload.
- Opened the command palette with Command-Shift-P and dismissed it with Escape.
- Verified the local profile empty state, personal-best blocks, activity calendar, filters, and backup actions.
- Verified local storage initialization refreshes already-mounted views and that local results drive profile statistics, personal bests, XP, streaks, charts, and history.

## Intentional offline differences

- No ads or merch banner.
- No sign-in, notifications, public profile, cloud sync, leaderboards, multiplayer, or other network-only actions.
- Local profile, local activity navigation, backup/restore, and local-only footer copy replace those online surfaces.

No unresolved visual or interaction findings remained after the final matched-state comparison.

final result: passed
