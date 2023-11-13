import type { R2Object, R2StringChecksums, R2HTTPMetadata, R2MultipartUpload } from "@cloudflare/workers-types/experimental";

export type Dispatch = (
  operation: string,
  parameters: unknown[],
  body?: BodyInit,
) => Promise<Response>;

export type R2ObjectJSON = Omit<
  R2Object,
  "uploaded" | "checksums" | "httpMetadata" | "writeHttpMetadata"
> & {
  uploaded: string;
  checksums: R2StringChecksums;
  httpMetadata: Omit<R2HTTPMetadata, "cacheExpiry"> & {
    // Original is typeof `Date`
    cacheExpiry?: string;
  };
};

export type R2ObjectsJSON = Omit<R2Objects, "objects"> & {
  objects: R2ObjectJSON[];
};

export type R2MultipartUploadJSON = Pick<R2MultipartUpload, "key" | "uploadId">;
