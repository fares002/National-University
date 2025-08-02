// HTTP Status text constants for consistent API responses
export const httpStatusText = {
  SUCCESS: "success",
  FAIL: "fail",
  ERROR: "error",
} as const;

// Type for TypeScript intellisense
export type HttpStatusText =
  (typeof httpStatusText)[keyof typeof httpStatusText];
