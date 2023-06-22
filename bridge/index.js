// @ts-check
import { KVBridge } from "./kv.js";

/** @param {string} wranglerUrl */
export const createBridge = (wranglerUrl) => {
  // console.log("createBridge", { wranglerUrl });
  return {
    /** @param {string} namespaceId */
    KV: (namespaceId) => new KVBridge(wranglerUrl, namespaceId),
  };
};
