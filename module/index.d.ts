export type BridgeModuleOptions = {
  bridgeWorkerOrigin?: string;
};

export declare function getBindings<Env>(
  options?: BridgeModuleOptions,
): Promise<Env>;

export declare class KVNamespace$<T> {
  constructor(namespaceId: string, options?: BridgeModuleOptions): T;
}

export declare class R2Bucket$<T> {
  constructor(namespaceId: string, options?: BridgeModuleOptions): T;
}

export declare class D1Database$<T> {
  constructor(namespaceId: string, options?: BridgeModuleOptions): T;
}

export declare class WorkerQueue$<T> {
  constructor(namespaceId: string, options?: BridgeModuleOptions): T;
}

export declare class VectorizeIndex$<T> {
  constructor(namespaceId: string, options?: BridgeModuleOptions): T;
}

export declare class Fetcher$<T> {
  constructor(namespaceId: string, options?: BridgeModuleOptions): T;
}
