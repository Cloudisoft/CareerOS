import * as React from "react";

/**
 * React's per-request `cache` (one call per server render). It only exists in
 * Next's server build of React, so in plain Node (unit tests, scripts) the
 * function runs uncached instead.
 */
export const requestCache: <T extends (...args: never[]) => unknown>(fn: T) => T =
  (React as unknown as { cache?: <T>(fn: T) => T }).cache ?? ((fn) => fn);
