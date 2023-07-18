export declare function createBridge(bridgeWranglerOrigin?: string): {
  // Should be typed here...?
  KV<Type>(namespaceId: string): Type;
  SERVICE<Type>(namespaceId: string, serviceWranlgerOrigin?: string): Type;
  R2<Type>(namespaceId: string): Type;
  D1<Type>(namespaceId: string): Type;
};
