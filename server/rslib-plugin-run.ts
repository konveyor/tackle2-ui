import { spawn } from "node:child_process";

import {
  type RsbuildPlugin,
  type RsbuildPluginAPI,
  createLogger,
} from "@rsbuild/core";
import { color } from "rslog";

function createPrefixLogger(api: RsbuildPluginAPI, prefix: string) {
  return createLogger({
    ...api.logger.options,
    prefix: color.dim(prefix),
    level: api.logger.level,
  });
}

/**
 * A rslib plugin which runs your bundle in Node once it has been built. In watch mode, every
 * time the bundle is rebuilt, the process will be killed and a new one will be spawned.
 */
export const pluginRunNode = ({
  entryPath,
  execArgv = [],
}: {
  /** Entry point to run */
  entryPath?: string;
  /** Additional arguments to pass to the node process */
  execArgv?: string[];
}): RsbuildPlugin => ({
  name: "plugin-run-node",
  setup(api) {
    const logger = createPrefixLogger(api, "[run]");
    logger.start("plugin started...");

    let child: ReturnType<typeof spawn> | null = null;
    let controller: AbortController | null = null;

    const killChild = (): Promise<void> => {
      if (!child) return Promise.resolve();
      return new Promise<void>((resolve) => {
        child!.on("close", () => resolve());
        controller!.abort();
      });
    };

    // Redirect SIGINT/SIGTERM to a clean process.exit(0) so rslib's normal
    // shutdown runs and triggers api.onExit below. Without this, Node's default
    // handler exits with code 130 and npm reports "npm error code 130".
    process.on("SIGINT", () => process.exit(0));
    process.on("SIGTERM", () => process.exit(0));

    api.onAfterBuild({
      order: "post",
      handler: async ({ isFirstCompile }) => {
        await killChild();

        if (!entryPath) {
          logger.error("Entry path is required");
          return;
        }

        const action = isFirstCompile ? "Starting" : "Restarting";
        logger.info(`${action} node ${entryPath}...`);

        controller = new AbortController();
        child = spawn("node", [...execArgv, entryPath], {
          stdio: "inherit",
          detached: true,
          signal: controller.signal,
        });

        child.on("close", () => {
          child = null;
          controller = null;
        });

        child.on("error", (err) => {
          if (err.name !== "AbortError") {
            logger.error("Failed to start process:", err);
          }
        });
      },
    });

    api.onExit(() => {
      logger.info("exiting, killing child process", child?.pid);
      controller?.abort();
    });

    logger.ready(`ready to run ${entryPath} when build is complete...`);
  },
});
