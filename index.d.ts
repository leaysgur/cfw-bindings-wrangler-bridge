export declare function createBridge(bridgeWranglerOrigin: string): {
  // Should be typed here...?
  KV(namespaceId: string): any;
  R2(namespaceId: string): any;
  SERVICE(namespaceId: string, serviceWranlgerOrigin?: string): any;
};
