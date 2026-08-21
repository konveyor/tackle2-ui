import { spawn } from "node:child_process";

import type { RsbuildPlugin } from "@rsbuild/core";

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
    api.logger.start("[run] plugin started...");
    let child: ReturnType<typeof spawn> | null = null;

    const killChild = (): Promise<void> => {
      if (!child) return Promise.resolve();
      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          child?.kill("SIGKILL");
        }, 3000);
        child?.on("exit", () => {
          clearTimeout(timeout);
          child = null;
          resolve();
        });
        child?.kill("SIGTERM");
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
          api.logger.error("[run] Entry path is required");
          return;
        }

        const action = isFirstCompile ? "Starting" : "Restarting";
        api.logger.info(`[run] ${action} node ${entryPath}...`);
        child = spawn("node", [...execArgv, entryPath], {
          stdio: "inherit",
          shell: false,
          detached: true,
        });

        child.on("error", (err) => {
          api.logger.error("[run] Failed to start process:", err);
        });
      },
    });

    // Fires after process.exit(0) above; synchronously kills the child so it
    // doesn't become an orphan now that it's in its own process group.
    api.onExit(() => {
      api.logger.info("[run] exiting, killing child process", child?.pid);
      child?.kill("SIGTERM");
    });

    api.logger.start(
      `[run] ready to run ${entryPath} when build is complete...`
    );
  },
});
