// @ts-check
import { KVBridge } from "./kv.js";

/** @param {string} wranglerUrl */
export const createBridge = (wranglerUrl) => ({
  /** @param {string} bindingName */
  KV: (bindingName) => new KVBridge(wranglerUrl, bindingName),
});
