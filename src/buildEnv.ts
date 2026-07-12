import { requireOptionalNativeModule } from 'expo-modules-core';

/**
 * Build-channel detection so we can show hidden dev tools (the trial reset) in **dev and
 * TestFlight** builds but never in **App Store production**.
 *
 * `isProductionAppStore` lives on the LiveActivity native module (same local package) to avoid
 * registering a second module. It returns true only when the app was installed from the
 * production App Store (a "receipt" file); TestFlight ("sandboxReceipt") and dev builds return
 * false. If the native function is unavailable (e.g. not yet rebuilt), we default to OFF.
 */
const native = requireOptionalNativeModule<{ isProductionAppStore?: () => boolean }>('LiveActivity');

export const devToolsEnabled: boolean = native?.isProductionAppStore
  ? !native.isProductionAppStore()
  : false;
