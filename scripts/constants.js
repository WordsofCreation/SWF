/**
 * Shared constants and lightweight runtime helpers for the SWF module.
 */
(() => {
  const MODULE_ID = "swf-module";

  const settingKey = (key) => `${MODULE_ID}.${key}`;

  const isDebugEnabled = () => {
    try {
      return game?.settings?.get(MODULE_ID, "debugLogging") === true;
    } catch {
      return false;
    }
  };

  const log = (...args) => {
    if (!isDebugEnabled()) return;
    console.log(`[${MODULE_ID}]`, ...args);
  };

  globalThis.SWF = {
    MODULE_ID,
    settingKey,
    log
  };
})();
