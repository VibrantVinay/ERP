import { Router } from 'express';

export interface AppContext {
  config: Record<string, any>;
  logger: Console;
}

export interface PluggableApp {
  /** Unique identifier for the app, e.g. 'pos', 'kitchen' */
  readonly id: string;
  /** Human-readable title */
  readonly name: string;
  /** Route prefix without global apiPrefix, e.g. '/pos', '/orders' */
  readonly routePrefix: string;
  /** Express router carrying endpoints */
  readonly router: Router;
  /** Optional lifecycle initialization hook */
  init?(context: AppContext): Promise<void> | void;
}

