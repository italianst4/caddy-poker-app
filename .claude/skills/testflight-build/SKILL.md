---
name: testflight-build
description: Create a signed App Store / TestFlight build of CaddyPoker — bump the build number in all three places, archive for App Store distribution, export a signed .ipa, and hand it off for Transporter upload. Use when asked to "make a TestFlight build", "build for the App Store", "upload to TestFlight", or "create a release build to upload".
---

# TestFlight / App Store build for CaddyPoker

Produce a signed, upload-ready `.ipa` for **CaddyPoker** (bundle `com.amontalbano.caddypoker`,
team `B26CL9L2G8`, scheme `CaddyPoker`, workspace `ios/CaddyPoker.xcworkspace`). Version lives in
`MARKETING_VERSION` (e.g. `1.0.0`); only the **build number** is bumped each time.

Run every command from the repo root (`/Users/amontalbano/git/caddy-poker-app`). The archive is long —
run it with `run_in_background: true` and wait for the completion notification.

## 0. Preflight

1. **Typecheck** — catch errors before the long archive:
   `npx tsc --noEmit` (must be clean).
2. **Workspace exists** — confirm `ios/CaddyPoker.xcworkspace` is present. If `ios/` is missing it
   was never prebuilt; run `npx expo prebuild -p ios` first, then apply the objectVersion fix below.
3. **objectVersion must be 77** (not 70) or `pod install` / tooling chokes:
   `grep -m1 objectVersion ios/CaddyPoker.xcodeproj/project.pbxproj`
   If it's 70: `sed -i '' 's/objectVersion = 70;/objectVersion = 77;/' ios/CaddyPoker.xcodeproj/project.pbxproj`
   (A clean prebuild re-stamps 70 — re-apply after any prebuild.)
4. If native deps changed (new pods) run `pod install --project-directory=ios` first (it may
   re-stamp objectVersion → re-check step 3).

## 1. Bump the build number (THREE places, must all match)

`ios/` is gitignored, but the App **Info.plist** has a *hardcoded* `CFBundleVersion` and the
**widget** (`CaddyWidgets.appex`) reads `$(CURRENT_PROJECT_VERSION)` from the pbxproj. If they
don't match, App Store validation fails with "bundle version of the extension must match the app".
`app.json` is the source of truth for future prebuilds.

Read the current number, then set the **next** one (current + 1) everywhere. Example bumping 5 → 6:

```bash
CUR=$(/usr/libexec/PlistBuddy -c 'Print :CFBundleVersion' ios/CaddyPoker/Info.plist)
NEXT=$((CUR + 1))
# a) app target Info.plist (literal)
/usr/libexec/PlistBuddy -c "Set :CFBundleVersion $NEXT" ios/CaddyPoker/Info.plist
# b) widget + configs in the pbxproj (there are 4 occurrences)
sed -i '' "s/CURRENT_PROJECT_VERSION = $CUR;/CURRENT_PROJECT_VERSION = $NEXT;/g" ios/CaddyPoker.xcodeproj/project.pbxproj
# c) app.json (drives future prebuilds)
python3 - "$NEXT" <<'PY'
import json,sys
p='app.json'; d=json.load(open(p)); d['expo']['ios']['buildNumber']=sys.argv[1]
json.dump(d,open(p,'w'),indent=2); open(p,'a').write('\n')
PY
# verify
grep -c "CURRENT_PROJECT_VERSION = $NEXT;" ios/CaddyPoker.xcodeproj/project.pbxproj  # expect 4
/usr/libexec/PlistBuddy -c 'Print :CFBundleVersion' ios/CaddyPoker/Info.plist        # expect $NEXT
```

Always use a build number **higher than anything already uploaded** to App Store Connect (you can't
reuse one). When unsure, bump.

## 2. Archive (App Store distribution) — run in background

```bash
xcodebuild -workspace ios/CaddyPoker.xcworkspace -scheme CaddyPoker -configuration Release \
  -destination 'generic/platform=iOS' -archivePath "$TMPDIR/CaddyPoker.xcarchive" \
  -allowProvisioningUpdates archive
```

Wait for it. Then confirm **ARCHIVE SUCCEEDED** and that the app **and** widget stamp the same
build number:

```bash
APP="$TMPDIR/CaddyPoker.xcarchive/Products/Applications/CaddyPoker.app"
/usr/libexec/PlistBuddy -c 'Print :CFBundleVersion' "$APP/Info.plist"
/usr/libexec/PlistBuddy -c 'Print :CFBundleVersion' "$APP/PlugIns/CaddyWidgets.appex/Info.plist"
```

## 3. Export the signed .ipa

Uses the repo's `ExportOptions.plist` (method `app-store-connect`, automatic signing, team
`B26CL9L2G8`, `manageAppVersionAndBuildNumber = false`).

```bash
xcodebuild -exportArchive -archivePath "$TMPDIR/CaddyPoker.xcarchive" \
  -exportOptionsPlist ExportOptions.plist -exportPath "$TMPDIR/CaddyPoker-export" \
  -allowProvisioningUpdates
```

Confirm **EXPORT SUCCEEDED**, then copy the `.ipa` to the Desktop with a versioned name:

```bash
VER=$(/usr/libexec/PlistBuddy -c 'Print :CFBundleShortVersionString' ios/CaddyPoker/Info.plist)
B=$(/usr/libexec/PlistBuddy -c 'Print :CFBundleVersion' ios/CaddyPoker/Info.plist)
cp "$TMPDIR/CaddyPoker-export/CaddyPoker.ipa" ~/Desktop/CaddyPoker-$VER-b$B.ipa
ls -lh ~/Desktop/CaddyPoker-$VER-b$B.ipa
```

## 4. Upload / hand off

Report the final `.ipa` path (`~/Desktop/CaddyPoker-<version>-b<build>.ipa`) and the version/build.
Default hand-off (no credentials on this machine): tell the user to open **Transporter**, sign in,
drag in the `.ipa`, and **Deliver** — it appears in App Store Connect → TestFlight after processing.

**Only if the user provides** an App Store Connect API key (a `.p8` file + Key ID + Issuer ID) can
you upload automatically — never ask for or paste secrets:

```bash
xcrun altool --upload-app -f ~/Desktop/CaddyPoker-<ver>-b<build>.ipa -t ios \
  --apiKey <KEY_ID> --apiIssuer <ISSUER_ID>
# (the AuthKey_<KEY_ID>.p8 must be in ~/.appstoreconnect/private_keys/ or ~/private_keys/)
```

## Notes

- Uses `xcodebuild` directly (NOT `npx expo run:ios`, which silently bails on this machine's
  Xcode/devicectl for device installs).
- Don't commit `ios/` (gitignored) or the archive/export/`.ipa`. The `app.json` build-number bump IS
  worth committing.
