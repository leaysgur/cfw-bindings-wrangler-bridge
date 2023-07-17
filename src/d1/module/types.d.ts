export type Dispatch = (
  operation: string,
  parameters: unknown[],
  body?: BodyInit,
) => Promise<Response>;
