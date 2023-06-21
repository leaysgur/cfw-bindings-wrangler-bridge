export const createBridge = (wranglerUrl) => ({
  KV: (namespaceId) => ({
    async list(options) {
      wranglerUrl;
      namespaceId;
      options;
      return {
        keys: [],
        list_complete: true,
        cursor: "",
      };
    },
    async put(key, value, options) {
      key;
      value;
      options;
    },
    async get(key, options) {
      key;
      options;
      return null;
    },
    async getWithMetadata(key, options) {
      key;
      options;
      return { value: null, metadata: null };
    },
    async delete(key) {
      key;
    },
  }),
});

createBridge("").KV("").get("");
