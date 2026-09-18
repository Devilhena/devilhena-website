/**
 * Logs only a route label and error class. Do not include messages, stacks,
 * request bodies, headers, or identifiers: those can contain sensitive data.
 */
export function logServerFailure(route: string, error: unknown) {
  const errorType = error instanceof Error && error.name ? error.name : "UnknownError";
  console.error("Server request failed", { route, errorType });
}
