/* eslint-disable @typescript-eslint/no-require-imports */

import createBundler from "@bahmutov/cypress-esbuild-preprocessor";
import { defineConfig } from "cypress";
import cypressFastFail from "cypress-fail-fast/plugin";
import { tagify } from "cypress-tags";
import decompress from "decompress";

const { verifyDownloadTasks } = require("cy-verify-downloads");
const { downloadFile } = require("cypress-downloadfile/lib/addPlugin");
const cypressFsPlugins = require("cypress-fs/plugins");
const cypressMochawesomeReporter = require("cypress-mochawesome-reporter/plugin");

export default defineConfig({
  // Cypress.env() values
  env: {
    jira_stage_datacenter_url: "https://issues.stage.redhat.com/",
    jira_stage_bearer_token: "",
    jira_stage_basic_login: "",
    jira_stage_basic_password: "",
    jira_atlassian_cloud_email: "",
    jira_atlassian_cloud_token: "",
    jira_atlassian_cloud_url: "",
    jira_atlassian_cloud_project: "Test",
    jira_stage_datacenter_project_id: 12335626,
    rwx_enabled: true,
    logLevel: "INFO",
    mtaVersion: "",
    FAIL_FAST_PLUGIN: true,
    FAIL_FAST_ENABLED: false,
    metricsUrl: "",
  },

  // Cypress.config() values
  viewportWidth: 1920,
  viewportHeight: 1080,
  video: false,
  videosFolder: "run/videos",
  screenshotsFolder: "run/screenshots",
  downloadsFolder: "run/downloads",

  retries: {
    runMode: 0,
    openMode: 0,
  },
  defaultCommandTimeout: 8000,
  experimentalMemoryManagement: true,

  reporter: "../node_modules/cypress-multi-reporters",
  reporterOptions: {
    reporterEnabled: "mocha-junit-reporter, cypress-mochawesome-reporter",
    mochaJunitReporterReporterOptions: {
      mochaFile: "run/report/junit/results-[hash].xml",
    },
    cypressMochawesomeReporterReporterOptions: {
      reportDir: "run/report",
      reportPageTitle: "Konveyor E2E Tests",
      reportTitle: "Konveyor E2E Tests",
      charts: true,
      embeddedScreenshots: true,
      inline: true,
      saveJson: true,
      // timestamp: "isoUtcDateTime",
    },
  },

  e2e: {
    baseUrl: process.env.CYPRESS_BASE_URL || "http://localhost:9000",
    specPattern: [
      "e2e/tests/login.test.ts",
      "e2e/tests/**/*.test.{js,jsx,ts,tsx}",
    ],
    supportFile: "support/e2e.ts",
    fixturesFolder: "fixtures",

    setupNodeEvents(on, config) {
      config.env.initialPassword = process.env.CYPRESS_INITIAL_PASSWORD;
      config.env.user = process.env.CYPRESS_USER;
      config.env.pass = process.env.CYPRESS_PASSWORD;
      config.env.keycloakAdminPassword =
        process.env.CYPRESS_KEYCLOAK_ADMIN_PASSWORD;
      config.env.git_user = process.env.CYPRESS_GIT_USER;
      config.env.git_password = process.env.CYPRESS_GIT_PASSWORD;
      config.env.svn_user = process.env.CYPRESS_SVN_USER;
      config.env.svn_password = process.env.CYPRESS_SVN_PASSWORD;

      // Plugins
      on("file:preprocessor", createBundler());
      on("file:preprocessor", tagify(config));
      cypressFastFail(on, config);
      cypressFsPlugins(on, config);
      cypressMochawesomeReporter(on, config);

      on("task", { downloadFile });
      on("task", verifyDownloadTasks);
      on("task", {
        unzip: ({ path, file }) => {
          decompress(path + file, path + "/" + file.split(".")[0]);
          return null;
        },
      });
      return config;
    },
  },
});
