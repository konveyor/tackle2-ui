import { spawn } from "node:child_process";

import type { RsbuildPluginAPI } from "@rsbuild/core";

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
}) => ({
  name: "plugin-run-node",
  setup(api: RsbuildPluginAPI) {
    let child: ReturnType<typeof spawn> | null = null;

    api.onAfterBuild(() => {
      // Kill the existing process if it's running
      if (child) {
        child.kill("SIGTERM");
      }

      // Attempt to lookup the entry path if it is not provided
      if (!entryPath) {
        console.error("❌ [run] Entry path is required");
        return;
      }

      // Spawn the new process and inherit stdio so console.logs look normal
      console.log(`\n🚀 [run] Starting node ${entryPath}...`);
      child = spawn("node", [...execArgv, entryPath], {
        stdio: "inherit",
        shell: true,
      });

      child.on("error", (err) => {
        console.error("❌ [run] Failed to start process:", err);
      });
    });

    // Clean up the process if Rslib exits
    process.on("exit", () => child?.kill("SIGTERM"));
  },
});
