import { type KVNamespace } from "@cloudflare/workers-types";

export declare function createBridge(wranglerUrl: string): {
  KV<K>(namespaceId: string): KVNamespace<K>;
};
