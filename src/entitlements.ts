import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import Purchases, { type CustomerInfo, type PurchasesError } from 'react-native-purchases';
import { create } from 'zustand';
import { track } from './analytics';

/**
 * Access control: a 21-day free trial followed by a one-time non-consumable unlock ($5.99).
 *
 * Apple has no built-in trial for one-time purchases, so the trial is enforced here. The
 * trial start is stored in the iOS Keychain (via expo-secure-store) so deleting & reinstalling
 * the app does NOT reset it. The purchase itself is handled by RevenueCat; the entitlement is
 * account-bound, so a reinstall restores it via "Restore Purchase" (or automatically).
 *
 * Null-safe: if no RevenueCat key is set in `app.json` → `extra.revenueCatKeyIos`, the app runs
 * in trial-only mode (purchases no-op) so it still works before the store is configured.
 * No PII is sent — purchase events carry only ids, prices, and booleans.
 */
const extra = (Constants.expoConfig?.extra ?? {}) as {
  revenueCatKeyIos?: string;
  unlockProductId?: string;
  trialDays?: number;
};

const RC_KEY = extra.revenueCatKeyIos?.trim();
// The native iOS SDK only accepts an Apple App Store *public* key (prefix `appl_`). Anything
// else (empty, a `test_`/secret key, a Google key) is treated as "not configured" so the app
// runs in trial-only mode instead of crashing on `Purchases.configure()`.
const RC_USABLE = !!RC_KEY && RC_KEY.startsWith('appl_');
const PRODUCT_ID = extra.unlockProductId?.trim() || 'com.amontalbano.caddypoker.fullunlock';
const TRIAL_DAYS = typeof extra.trialDays === 'number' ? extra.trialDays : 30;
const ENTITLEMENT_ID = 'full_access';

const DAY_MS = 24 * 60 * 60 * 1000;
const TRIAL_KEY = 'caddy.trialStartAt';
const SEEN_KEY = 'caddy.lastSeen';

type EntState = {
  /** True once the boot check (trial anchor + entitlement fetch) has completed. */
  ready: boolean;
  /** True when the non-consumable unlock entitlement is active. */
  isUnlocked: boolean;
  /** Epoch ms when the trial began (Keychain-anchored). Null until loaded. */
  trialStartAt: number | null;
  /** Max wall-clock seen (persisted), used to blunt clock-rollback trial extension. */
  lastSeen: number;
  /** Localized store price string (e.g. "$5.99") once offerings load; null otherwise. */
  priceString: string | null;
};

export const useEntitlements = create<EntState>(() => ({
  ready: false,
  isUnlocked: false,
  trialStartAt: null,
  lastSeen: 0,
  priceString: null,
}));

// ---- derived access ----

/** Days remaining in the free trial (0 once expired). Uses a rollback-guarded "now". */
export function trialDaysLeft(s: EntState, now = Date.now()): number {
  if (s.trialStartAt == null) return TRIAL_DAYS;
  const effectiveNow = Math.max(now, s.lastSeen); // ignore backward clock moves
  const used = Math.floor((effectiveNow - s.trialStartAt) / DAY_MS);
  return Math.max(0, TRIAL_DAYS - used);
}

/** The gate: full access while unlocked OR the trial is still running. */
export function hasAccess(s: EntState, now = Date.now()): boolean {
  return s.isUnlocked || trialDaysLeft(s, now) > 0;
}

// Reactive hooks for components.
export const useHasAccess = () => useEntitlements((s) => hasAccess(s));
export const useTrialDaysLeft = () => useEntitlements((s) => trialDaysLeft(s));
export const useIsUnlocked = () => useEntitlements((s) => s.isUnlocked);
export const useEntitlementsReady = () => useEntitlements((s) => s.ready);
export const useUnlockPrice = () => useEntitlements((s) => s.priceString);

// ---- boot ----

let started = false;

/** Run once at app boot (before first paint) so `hasAccess` is known immediately. */
export async function initEntitlements(): Promise<void> {
  if (started) return;
  started = true;

  const { trialStartAt, lastSeen } = await loadTrialAnchor();
  useEntitlements.setState({ trialStartAt, lastSeen });

  if (!RC_USABLE) {
    if (RC_KEY) {
      console.warn('[entitlements] Ignoring RevenueCat key: iOS needs an "appl_" App Store key. Running trial-only.');
    }
    useEntitlements.setState({ ready: true });
    return;
  }

  try {
    Purchases.configure({ apiKey: RC_KEY! });
    Purchases.addCustomerInfoUpdateListener((info) => {
      useEntitlements.setState({ isUnlocked: isEntitled(info) });
    });
    const info = await Purchases.getCustomerInfo();
    useEntitlements.setState({ isUnlocked: isEntitled(info) });
    loadPrice(); // best-effort, non-blocking
  } catch {
    // Offline / store error: fall back to cached entitlement + local trial. Never block boot.
  } finally {
    useEntitlements.setState({ ready: true });
  }
}

function isEntitled(info: CustomerInfo): boolean {
  return info.entitlements.active[ENTITLEMENT_ID] != null;
}

/** Read (or initialize) the Keychain-backed trial start; bump the monotonic lastSeen. */
async function loadTrialAnchor(): Promise<{ trialStartAt: number; lastSeen: number }> {
  const now = Date.now();
  try {
    const [storedStart, storedSeen] = await Promise.all([
      SecureStore.getItemAsync(TRIAL_KEY),
      SecureStore.getItemAsync(SEEN_KEY),
    ]);
    const lastSeen = Math.max(now, storedSeen ? Number(storedSeen) || 0 : 0);
    await SecureStore.setItemAsync(SEEN_KEY, String(lastSeen));

    const parsed = storedStart ? Number(storedStart) : NaN;
    if (Number.isFinite(parsed)) return { trialStartAt: parsed, lastSeen };

    // First launch on this device (or after reinstall with the Keychain wiped): start now.
    await SecureStore.setItemAsync(TRIAL_KEY, String(now));
    track('trial_started', { trial_days: TRIAL_DAYS });
    return { trialStartAt: now, lastSeen };
  } catch {
    // SecureStore unavailable (shouldn't happen on device): trial starts this session.
    return { trialStartAt: now, lastSeen: now };
  }
}

async function loadPrice(): Promise<void> {
  try {
    const offerings = await Purchases.getOfferings();
    const pkg = offerings.current?.availablePackages?.[0];
    if (pkg) useEntitlements.setState({ priceString: pkg.product.priceString });
  } catch {
    // ignore — the paywall falls back to a hardcoded price label
  }
}

// ---- actions ----

export type PurchaseResult = 'purchased' | 'cancelled' | 'unavailable' | 'error';

/** Buy the one-time unlock. Returns a coarse status the UI can message on. */
export async function purchaseUnlock(): Promise<PurchaseResult> {
  if (!RC_USABLE) return 'unavailable';
  track('purchase_started');
  try {
    // Preferred path: a configured RevenueCat offering/package.
    const offerings = await Purchases.getOfferings();
    const pkg =
      offerings.current?.availablePackages?.[0] ??
      Object.values(offerings.all)[0]?.availablePackages?.[0];

    let customerInfo;
    if (pkg) {
      ({ customerInfo } = await Purchases.purchasePackage(pkg));
    } else {
      // Fallback: buy the product directly by id. Lets local StoreKit-config testing work
      // with only the product + entitlement set up (no RevenueCat *offering* required).
      const products = await Purchases.getProducts([PRODUCT_ID]);
      const product = products[0];
      if (!product) {
        track('purchase_failed', { reason: 'no_product' });
        return 'unavailable';
      }
      ({ customerInfo } = await Purchases.purchaseStoreProduct(product));
    }

    const unlocked = isEntitled(customerInfo);
    useEntitlements.setState({ isUnlocked: unlocked });
    track('purchase_completed', { product_id: PRODUCT_ID });
    return unlocked ? 'purchased' : 'error';
  } catch (e) {
    const err = e as PurchasesError;
    if (err?.userCancelled) {
      track('purchase_cancelled');
      return 'cancelled';
    }
    track('purchase_failed', { reason: String(err?.code ?? 'unknown') });
    return 'error';
  }
}

// ---- dev/testing helpers (reachable only via the hidden long-press in the Menu) ----

/** Force the trial to read as expired so the hard paywall can be tested without waiting. */
export async function devExpireTrial(): Promise<void> {
  const past = Date.now() - (TRIAL_DAYS + 2) * DAY_MS;
  try {
    await SecureStore.setItemAsync(TRIAL_KEY, String(past));
  } catch {
    // ignore — still update in-memory state below
  }
  useEntitlements.setState({ trialStartAt: past });
}

/** Restart the trial from now. */
export async function devResetTrial(): Promise<void> {
  const now = Date.now();
  try {
    await SecureStore.setItemAsync(TRIAL_KEY, String(now));
    await SecureStore.setItemAsync(SEEN_KEY, String(now));
  } catch {
    // ignore
  }
  useEntitlements.setState({ trialStartAt: now, lastSeen: now });
}

/** Restore a previous unlock (required by Apple for non-consumables). */
export async function restore(): Promise<boolean> {
  if (!RC_USABLE) return false;
  try {
    const info = await Purchases.restorePurchases();
    const unlocked = isEntitled(info);
    useEntitlements.setState({ isUnlocked: unlocked });
    track('purchase_restored', { unlocked });
    return unlocked;
  } catch {
    track('purchase_failed', { reason: 'restore_error' });
    return false;
  }
}
