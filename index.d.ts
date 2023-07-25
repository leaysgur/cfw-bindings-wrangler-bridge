export declare function createBridge(bridgeWranglerOrigin?: string): {
  // Should be typed here...?
  KVNamespace<Type>(namespaceId: string): Type;
  Fetcher<Type>(namespaceId: string, serviceWranlgerOrigin?: string): Type;
  R2Bucket<Type>(namespaceId: string): Type;
  D1Database<Type>(namespaceId: string): Type;
};
