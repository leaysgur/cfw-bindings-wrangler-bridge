export type Dispatch = (
  operation: string,
  parameters: unknown[],
) => Promise<Response>;
