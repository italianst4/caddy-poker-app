# App Review Notes — CaddyPoker

*(Paste the section below into App Store Connect → your app version → **App Review Information → Notes**. Trim as needed.)*

---

CaddyPoker is a local, pass-and-play party game for 2–4 golfers. There is no account, no login, and no network multiplayer — all play happens on one device that players pass around. No sign-in is required to review the app.

**Trial & purchase model**
The app is free to download with a **30-day full-access trial that is enforced in-app** (Apple has no built-in trial for one-time purchases, so we track it ourselves). After 30 days, the full game requires a **one-time, non-consumable purchase** — "Full Game Unlock," product ID `com.amontalbano.caddypoker.fullunlock`, $5.99. It is **not** a subscription and never recurs. A **Restore Purchase** option is available on the paywall and in the Menu.

**How to reach the paywall during review** (the trial will not have expired for you):
- Open **Menu (top-left ☰) → "Unlock Full Game"**, or
- The paywall also appears automatically from **New Round** once a trial has expired.

**How to test the purchase (sandbox):** tap **Unlock — $5.99** on the paywall and complete the purchase with a Sandbox Apple ID. On success, full access is granted immediately and the paywall dismisses.

**Simulated gambling:** the poker portion is a card-hand party game with **no real-money wagering, no in-app currency, and no betting** — points/challenges only.

**Privacy:** the app collects only **anonymous** product-usage analytics (no names, no accounts, no advertising identifiers/IDFA, no App Tracking Transparency prompt). Player names typed for a game stay on-device and are never transmitted.

**Live Activities:** an optional toggle ("Show Live Activity") displays each golfer's current challenge on the Lock Screen during a round.

Contact: amontalbano@gmail.com

---

## Internal reminders (do NOT paste into App Store Connect)

- **Before the FINAL App Store submission**, decide on the hidden dev control: the Menu copyright long-press exposes "Expire/Reset trial." It's harmless but should be removed or build-gated for the public release. (It's fine to leave in TestFlight builds.)
- Ensure the IAP `com.amontalbano.caddypoker.fullunlock` is **"Ready to Submit"** and attached to this app version (first IAP is reviewed with the app).
- Confirm **Paid Apps Agreement + banking/tax** are active, and the RevenueCat product↔`full_access` entitlement mapping is live.
- Age rating questionnaire: answer the **Simulated Gambling** question honestly (poker) — expect a higher rating.
