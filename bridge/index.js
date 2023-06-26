// @ts-check
import { KVBridge } from "./kv.js";
import { ServiceBridge, ServiceBridgeDirect } from "./service.js";

/** @param {string} bridgeWranglerOrigin */
export const createBridge = (bridgeWranglerOrigin) => ({
  /** @param {string} bindingName */
  KV: (bindingName) => new KVBridge(bridgeWranglerOrigin, bindingName),
  /**
   * @param {string} bindingName
   * @param {string} [serviceWranglerOrigin]
   */
  SERVICE: (bindingName, serviceWranglerOrigin) =>
    serviceWranglerOrigin
      ? new ServiceBridgeDirect(serviceWranglerOrigin)
      : new ServiceBridge(bridgeWranglerOrigin, bindingName),
});
