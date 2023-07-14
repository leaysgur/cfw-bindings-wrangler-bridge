export type Dispatch = (
  operation: string,
  paramters: unknown[],
  body?: BodyInit,
) => Promise<Response>;

export type R2ObjectJSON = Omit<
  R2Object,
  "uploaded" | "checksums" | "httpMetadata" | "writeHttpMetadata"
> & {
  uploaded: string;
  checksums: R2StringChecksums;
  httpMetadata: Omit<R2HTTPMetadata, "cacheExpiry"> & {
    cacheExpiry?: string;
  };
};

export type R2ObjectsJSON = Omit<R2Objects, "objects"> & {
  objects: R2ObjectJSON[];
};

export type R2MultipartUploadJSON = Pick<R2MultipartUpload, "key" | "uploadId">;
