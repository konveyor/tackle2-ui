import { Application } from "@app/api/models";

import { isModeSupported } from "./analysis-source";

describe("analysis-wizard utils - isModeSupported()", () => {
  it("should return true for binary-upload mode regardless of application state", () => {
    const application: Application = {
      id: 1,
      name: "Test App",
      migrationWave: null,
    };
    expect(isModeSupported(application, "binary-upload")).toBe(true);
  });

  it("should return true for binary mode when application has valid binary format", () => {
    const application: Application = {
      id: 1,
      name: "Test App",
      binary: "group:artifact:version",
      migrationWave: null,
    };
    expect(isModeSupported(application, "binary")).toBe(true);
  });

  it("should return false for binary mode when application binary is missing", () => {
    const application: Application = {
      id: 1,
      name: "Test App",
      migrationWave: null,
    };
    expect(isModeSupported(application, "binary")).toBe(false);
  });

  it("should return false for binary mode when application binary is empty", () => {
    const application: Application = {
      id: 1,
      name: "Test App",
      binary: "",
      migrationWave: null,
    };
    expect(isModeSupported(application, "binary")).toBe(false);
  });

  it("should return false for binary mode when application binary does not match pattern", () => {
    const application: Application = {
      id: 1,
      name: "Test App",
      binary: "invalid-format",
      migrationWave: null,
    };
    expect(isModeSupported(application, "binary")).toBe(false);
  });

  it("should return true for source-code-deps mode when repository URL exists", () => {
    const application: Application = {
      id: 1,
      name: "Test App",
      repository: {
        url: "https://github.com/user/repo.git",
      },
      migrationWave: null,
    };
    expect(isModeSupported(application, "source-code-deps")).toBe(true);
  });

  it("should return false for source-code-deps mode when repository URL is missing", () => {
    const application: Application = {
      id: 1,
      name: "Test App",
      migrationWave: null,
    };
    expect(isModeSupported(application, "source-code-deps")).toBe(false);
  });

  it("should return false for source-code-deps mode when repository URL is empty", () => {
    const application: Application = {
      id: 1,
      name: "Test App",
      repository: {
        url: "",
      },
      migrationWave: null,
    };
    expect(isModeSupported(application, "source-code-deps")).toBe(false);
  });

  it("should return true for source-code mode when repository URL exists", () => {
    const application: Application = {
      id: 1,
      name: "Test App",
      repository: {
        url: "https://github.com/user/repo.git",
      },
      migrationWave: null,
    };
    expect(isModeSupported(application, "source-code")).toBe(true);
  });

  it("should return false for source-code mode when repository URL is missing", () => {
    const application: Application = {
      id: 1,
      name: "Test App",
      migrationWave: null,
    };
    expect(isModeSupported(application, "source-code")).toBe(false);
  });

  it("should return false for source-code mode when repository URL is empty", () => {
    const application: Application = {
      id: 1,
      name: "Test App",
      repository: {
        url: "",
      },
      migrationWave: null,
    };
    expect(isModeSupported(application, "source-code")).toBe(false);
  });

  it("should return false for undefined mode", () => {
    const application: Application = {
      id: 1,
      name: "Test App",
      migrationWave: null,
    };
    expect(isModeSupported(application, undefined)).toBe(false);
  });

  it("should return false for unknown mode", () => {
    const application: Application = {
      id: 1,
      name: "Test App",
      migrationWave: null,
    };
    expect(isModeSupported(application, "unknown-mode")).toBe(false);
  });
});
