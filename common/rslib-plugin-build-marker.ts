import fs from "node:fs";
import path from "node:path";

import type { RsbuildPlugin } from "@rsbuild/core";

const isDev = process.env.NODE_ENV === "development";
const isWatch =
  isDev && (process.argv.includes("--watch") || process.argv.includes("-w"));

/**
 * Resolves `filePath` relative to `root`, then asserts the result stays inside
 * `root`. Throws if the resolved path escapes the root (e.g. via `../`).
 */
const chrootResolve = (root: string, filePath: string): string => {
  const resolved = path.resolve(root, filePath);
  const rootWithSep = root.endsWith(path.sep) ? root : root + path.sep;
  if (!resolved.startsWith(rootWithSep)) {
    throw new Error(
      `chrootResolve: path must resolve inside root.\n` +
        `  root:     ${root}\n` +
        `  resolved: ${resolved}`
    );
  }
  return resolved;
};

/**
 * A rslib plugin which will create/touch a marker file once the bundles are first generated. This
 * is to give `wait-on` a good file to wait for before starting other watch builds or dev servers.
 *
 * The marker is absent while a compile is in progress and is written when rslib returns to its
 * watch wait state after a successful build. Rslib emits one environment per `lib` format, so the
 * marker is written once all environments have finished compiling successfully.
 *
 * Uses `onBeforeEnvironmentCompile` to track individual environment invalidation (rather than
 * clearing all state in `onBeforeBuild`) because plugins like VirtualModulesPlugin can trigger
 * partial recompilations of a single environment. The marker is written in `onAfterBuild` at
 * `order: "post"` only for the first compile so it fires after DTS generation and rslib's own
 * "build completed" logging.
 */
export const pluginBuildMarker = ({
  markerFilePath,
  onlyOnWatch = true,
}: {
  markerFilePath: string;
  onlyOnWatch?: boolean;
}): RsbuildPlugin | undefined =>
  onlyOnWatch && !isWatch
    ? undefined
    : {
        name: "plugin-build-marker",
        setup(api) {
          api.logger.start("plugin-build-marker started...");

          const resolvedPath = chrootResolve(
            api.context.rootPath,
            markerFilePath
          );
          let totalEnvironments = 0;
          const finishedEnvironments = new Set<string>();

          const removeMarker = (): void => {
            if (fs.existsSync(resolvedPath)) {
              api.logger.info("Removing marker file from", resolvedPath);
              fs.rmSync(resolvedPath, { force: true });
            }
          };

          const writeMarker = (): void => {
            fs.mkdirSync(path.dirname(resolvedPath), { recursive: true });
            fs.writeFileSync(resolvedPath, `${new Date().toISOString()}\n`);
          };

          api.onBeforeBuild(({ isFirstCompile, environments }) => {
            if (isFirstCompile) {
              removeMarker();
            }
            totalEnvironments = Object.keys(environments).length;
          });

          api.onBeforeEnvironmentCompile(({ environment }) => {
            finishedEnvironments.delete(environment.name);
          });

          api.onAfterEnvironmentCompile(({ environment, stats }) => {
            if (stats?.hasErrors()) {
              return;
            }
            finishedEnvironments.add(environment.name);
          });

          api.onAfterBuild({
            order: "post",
            handler: ({ isFirstCompile }) => {
              if (
                isFirstCompile &&
                totalEnvironments > 0 &&
                finishedEnvironments.size === totalEnvironments
              ) {
                api.logger.success("first build complete, writing marker file");
                writeMarker();
              }
            },
          });

          api.logger.ready("build marker ready, path:", resolvedPath);
        },
      };
