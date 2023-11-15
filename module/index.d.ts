export type BridgeModuleOptions = {
  bridgeWorkerOrigin?: string;
};

export declare function getBindings<Env>(
  options?: BridgeModuleOptions,
): Promise<Env>;

export declare class KVNamespace$ {
  constructor(namespaceId: string, options?: BridgeModuleOptions);
}

export declare class R2Bucket$ {
  constructor(namespaceId: string, options?: BridgeModuleOptions);
}

export declare class D1Database$ {
  constructor(namespaceId: string, options?: BridgeModuleOptions);
}

export declare class WorkerQueue$ {
  constructor(namespaceId: string, options?: BridgeModuleOptions);
}

export declare class VectorizeIndex$ {
  constructor(namespaceId: string, options?: BridgeModuleOptions);
}

export declare class Fetcher$ {
  constructor(namespaceId: string, options?: BridgeModuleOptions);
}
