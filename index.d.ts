export declare function createBridge(bridgeWranglerOrigin?: string): {
  getBindings<Type>(): Promise<Type>;

  KVNamespace<Type>(namespaceId: string): Type;
  Fetcher<Type>(namespaceId: string, serviceWranlgerOrigin?: string): Type;
  R2Bucket<Type>(namespaceId: string): Type;
  D1Database<Type>(namespaceId: string): Type;
  Queue<Type>(napeSpaceId: string): Type;
  VectorizeIndex<Type>(namespaceId: string): Type;
};
