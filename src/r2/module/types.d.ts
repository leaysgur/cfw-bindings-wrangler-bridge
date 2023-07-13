export type R2HTTPMetadataJSON = Omit<R2HTTPMetadata, "cacheExpiry"> & {
  cacheExpiry?: string;
};

export type R2ObjectJSON = Omit<
  R2Object,
  "uploaded" | "checksums" | "httpMetadata" | "writeHttpMetadata"
> & {
  uploaded: string;
  checksums: R2StringChecksums;
  httpMetadata: R2HTTPMetadataJSON;
};

export type R2ObjectsJSON = Omit<R2Objects, "objects"> & {
  objects: R2ObjectJSON[];
};
