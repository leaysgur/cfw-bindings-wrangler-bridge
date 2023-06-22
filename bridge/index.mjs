// @ts-check
import { KVBridge } from "./kv.mjs";

/** @param {string} wranglerUrl */
export const createBridge = (wranglerUrl) => {
  // console.log("createBridge", { wranglerUrl });
  return {
    /** @param {string} namespaceId */
    KV: (namespaceId) => new KVBridge(wranglerUrl, namespaceId),
  };
};
