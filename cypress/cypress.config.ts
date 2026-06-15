/* eslint-disable @typescript-eslint/no-require-imports */

import { defineConfig } from "cypress";
import cypressFastFail from "cypress-fail-fast/plugin";
import { tagify } from "cypress-tags";
import decompress from "decompress";

const { verifyDownloadTasks } = require("cy-verify-downloads");
const { downloadFile } = require("cypress-downloadfile/lib/addPlugin");
const cypressFsPlugins = require("cypress-fs/plugins");
const cypressMochawesomeReporter = require("cypress-mochawesome-reporter/plugin");
const viewportWidth = 1920;
const viewportHeight = 1080;

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
    cloudfoundry_user: "",
    cloudfoundry_password: "",
    cloudfoundry_url: "https://api.bosh-lite.com",
    rwx_enabled: true,
    logLevel: "INFO",
    mtaVersion: "",
    FAIL_FAST_PLUGIN: true,
    FAIL_FAST_ENABLED: false,
    metricsUrl: "",
  },

  // Cypress.config() values
  viewportWidth: viewportWidth,
  viewportHeight: viewportHeight,
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
      config.env.user = process.env.CYPRESS_USER;
      config.env.pass = process.env.CYPRESS_PASSWORD;
      config.env.git_user = process.env.CYPRESS_GIT_USER;
      config.env.git_password = process.env.CYPRESS_GIT_PASSWORD;
      config.env.svn_user = process.env.CYPRESS_SVN_USER;
      config.env.svn_password = process.env.CYPRESS_SVN_PASSWORD;

      // Jira Atlassian Cloud credentials - override hardcoded defaults with environment variables
      if (process.env.CYPRESS_jira_atlassian_cloud_url) {
        config.env.jira_atlassian_cloud_url =
          process.env.CYPRESS_jira_atlassian_cloud_url;
      }
      if (process.env.CYPRESS_jira_atlassian_cloud_email) {
        config.env.jira_atlassian_cloud_email =
          process.env.CYPRESS_jira_atlassian_cloud_email;
      }
      if (process.env.CYPRESS_jira_atlassian_cloud_token) {
        config.env.jira_atlassian_cloud_token =
          process.env.CYPRESS_jira_atlassian_cloud_token;
      }
      if (process.env.CYPRESS_jira_atlassian_cloud_project) {
        config.env.jira_atlassian_cloud_project =
          process.env.CYPRESS_jira_atlassian_cloud_project;
      }

      // Jira Stage Datacenter credentials - override hardcoded defaults with environment variables
      if (process.env.CYPRESS_jira_stage_datacenter_url) {
        config.env.jira_stage_datacenter_url =
          process.env.CYPRESS_jira_stage_datacenter_url;
      }
      if (process.env.CYPRESS_jira_stage_bearer_token) {
        config.env.jira_stage_bearer_token =
          process.env.CYPRESS_jira_stage_bearer_token;
      }
      if (process.env.CYPRESS_jira_stage_basic_login) {
        config.env.jira_stage_basic_login =
          process.env.CYPRESS_jira_stage_basic_login;
      }
      if (process.env.CYPRESS_jira_stage_basic_password) {
        config.env.jira_stage_basic_password =
          process.env.CYPRESS_jira_stage_basic_password;
      }

      // Plugins
      on("file:preprocessor", tagify(config));
      cypressFastFail(on, config);
      cypressFsPlugins(on, config);
      cypressMochawesomeReporter(on, config);
      on(
        "before:browser:launch",
        (
          browser: Cypress.Browser,
          launchOptions: Cypress.BeforeBrowserLaunchOptions
        ) => {
          console.log(
            "launching browser %s is headless? %s",
            browser.name,
            browser.isHeadless
          );

          // the browser width and height we want to get
          // our screenshots and videos will be of that resolution
          const width = viewportWidth;
          const height = viewportHeight;

          console.log(
            "setting the browser window size to %d x %d",
            width,
            height
          );

          if (browser.name === "chrome" && browser.isHeadless) {
            launchOptions.args.push(`--window-size=${width},${height}`);

            // force screen to be non-retina and just use our given resolution
            launchOptions.args.push("--force-device-scale-factor=1");
          }

          if (browser.name === "electron" && browser.isHeadless) {
            // might not work on CI for some reason
            launchOptions.preferences.width = width;
            launchOptions.preferences.height = height;
          }

          if (browser.name === "firefox" && browser.isHeadless) {
            launchOptions.args.push(`--width=${width}`);
            launchOptions.args.push(`--height=${height}`);
          }

          // IMPORTANT: return the updated browser launch options
          return launchOptions;
        }
      );

      on("task", { downloadFile });
      on("task", verifyDownloadTasks);
      on("task", {
        unzip: ({ path, file }) => {
          decompress(path + file, path + "/" + file.split(".")[0]);
          return null;
        },
        log(message: string) {
          console.log(message);
          return null;
        },
      });
      return config;
    },
  },
});
