import { Express } from 'express';
import { PluggableApp, AppContext } from './base-app';
import { config } from './config';

export class AppRegistry {
  private apps: Map<string, PluggableApp> = new Map();

  /**
   * Registers a pluggable app into the registry
   */
  public register(app: PluggableApp): this {
    if (this.apps.has(app.id)) {
      throw new Error(`App with id "${app.id}" is already registered.`);
    }
    this.apps.set(app.id, app);
    return this;
  }

  /**
   * Registers a batch list of apps (like Django's INSTALLED_APPS)
   */
  public registerAll(apps: PluggableApp[]): this {
    for (const app of apps) {
      this.register(app);
    }
    return this;
  }

  /**
   * Mounts all registered apps onto the Express server
   */
  public async mount(expressApp: Express): Promise<void> {
    const context: AppContext = {
      config,
      logger: console,
    };

    console.log(`\n=== Initializing Installed Apps (${this.apps.size}) ===`);

    for (const [id, app] of this.apps.entries()) {
      if (app.init) {
        await app.init(context);
      }
      const fullPath = `${config.apiPrefix}${app.routePrefix}`;
      expressApp.use(fullPath, app.router);
      console.log(`  [+] Mounted app: ${app.name.padEnd(25)} -> ${fullPath}`);
    }
    console.log(`====================================================\n`);
  }

  /**
   * Returns list of registered apps metadata
   */
  public getInstalledAppsInfo() {
    return Array.from(this.apps.values()).map(a => ({
      id: a.id,
      name: a.name,
      routePrefix: `${config.apiPrefix}${a.routePrefix}`,
    }));
  }
}

