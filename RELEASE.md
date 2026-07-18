# Releasing to TestFlight (EAS)

This app uses a **managed/prebuild** workflow (`ios/` and `android/` are gitignored and regenerated
by EAS in the cloud from `app.json` + config plugins). Builds and TestFlight uploads go through
**EAS Build + Submit**. Distribution config lives in [`eas.json`](./eas.json).

- Apple Team: **B26CL9L2G8**
- Bundle IDs: `com.amontalbano.caddypoker` (app) + `com.amontalbano.caddypoker.widget` (widget)
- Versioning: **EAS-managed** (`appVersionSource: "remote"`, `autoIncrement` on the `production`
  profile) — EAS assigns/increments the build number each production build.

## One-time prerequisites
1. **Expo account** (free): https://expo.dev/signup
2. **App Store Connect API key** under team B26CL9L2G8, role *App Manager* (or Admin):
   App Store Connect → Users and Access → Integrations → App Store Connect API → **+** → download the
   `.p8` (once only), and note the **Key ID** and **Issuer ID**.
3. **App record** for `com.amontalbano.caddypoker` in App Store Connect (if it doesn't exist, `eas
   submit` can create it, or create it manually first).

## Provide the API key
```bash
mkdir -p credentials
cp ~/Downloads/AuthKey_XXXXXXXXXX.p8 credentials/asc_api_key.p8   # gitignored — never committed
```
Then edit [`eas.json`](./eas.json) → `submit.production.ios`: replace `REPLACE_WITH_KEY_ID` and
`REPLACE_WITH_ISSUER_ID`.

## Build + submit
```bash
# 0. Commit first — EAS builds from committed git state; uncommitted changes are NOT included.
git add -A && git commit -m "Release build"

# 1. Log in + link the project (writes extra.eas.projectId to app.json — commit it)
npx eas-cli login
npx eas-cli init

# 2. Build the signed App Store binary (first run sets up the distribution cert + profiles for
#    BOTH the app and the widget; choose the API-key option if prompted, or run `npx eas-cli
#    credentials` to register the key for signing).
npx eas-cli build --platform ios --profile production

# 3. Upload to TestFlight (uses the API key from eas.json)
npx eas-cli submit --platform ios --profile production --latest
```
Tip: `npx eas-cli build --platform ios --profile production --auto-submit` does both in one step.

After submit, the build shows up in **App Store Connect → TestFlight** (processing ~5–15 min), then
add internal/external testers.

## Notes
- If TestFlight rejects a build number as not higher than an existing one, run
  `npx eas-cli build:version:set` to align the remote build number.
- Local dev-to-device builds are unaffected: `npm run ios` / `expo run:ios --device` still work off
  the local `ios/` folder.
- The native modules added this cycle (`react-native-webview`, `expo-store-review`) are autolinked
  during EAS's cloud prebuild + pod install — no extra steps.
