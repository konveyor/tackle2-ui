import { act, render } from "@testing-library/react";
import { renderHook } from "@testing-library/react-hooks";
import { AxiosError } from "axios";
import {
  getAxiosErrorMessage,
  getValidatedFromError,
  getValidatedFromErrors,
  getToolbarChipKey,
  customURLValidation,
  gitUrlRegex,
  standardURLRegex,
} from "./utils";

describe("utils", () => {
  // getAxiosErrorMessage

  it("getAxiosErrorMessage: should pick axios message", () => {
    const errorMsg = "Network error";

    const mockAxiosError: AxiosError = {
      isAxiosError: true,
      name: "error",
      message: errorMsg,
      config: {},
      toJSON: () => ({}),
    };

    const errorMessage = getAxiosErrorMessage(mockAxiosError);
    expect(errorMessage).toBe(errorMsg);
  });

  it("getAxiosErrorMessage: should pick body message", () => {
    const errorMsg = "Internal server error";

    const mockAxiosError: AxiosError = {
      isAxiosError: true,
      name: "error",
      message: "Network error",
      config: {},
      response: {
        data: {
          errorMessage: errorMsg,
        },
        status: 400,
        statusText: "",
        headers: {},
        config: {},
      },
      toJSON: () => ({}),
    };

    const errorMessage = getAxiosErrorMessage(mockAxiosError);
    expect(errorMessage).toBe(errorMsg);
  });

  // getValidatedFromError

  it("getValidatedFromError: given value should return 'error'", () => {
    const error = "Any value";

    const status = getValidatedFromError(error);
    expect(status).toBe("error");
  });

  it("getValidatedFromError: given no value should return 'default'", () => {
    const status = getValidatedFromError(undefined);
    expect(status).toBe("default");
  });

  it("getValidatedFromErrors: given 'error' and 'touched' return 'error'", () => {
    const error = "Any value";
    const dirty = true;

    const status = getValidatedFromErrors(error, dirty);
    expect(status).toBe("error");
  });

  it("getValidatedFromErrors: given 'error' but not 'touched' return 'default'", () => {
    const error = "Any value";
    const dirty = false;

    const status = getValidatedFromErrors(error, dirty);
    expect(status).toBe("default");
  });

  // getToolbarChipKey

  it("getToolbarChipKey: test 'string'", () => {
    const result = getToolbarChipKey("myValue");
    expect(result).toBe("myValue");
  });

  it("getToolbarChipKey: test 'ToolbarChip'", () => {
    const result = getToolbarChipKey({ key: "myKey", node: "myNode" });
    expect(result).toBe("myKey");
  });

  //URL Regex tests
  it("Regex should validate git URLs", () => {
    const testGitURLs: string[] = [
      "git@github.com:konveyor/tackle2-ui",
      "http://git@github.com:konveyor/tackle2-ui",
    ];

    for (const url of testGitURLs) {
      const gitTestResult = gitUrlRegex.test(url);
      expect(gitTestResult).toBe(true);
    }
  });

  it("Regex should validate standard URLs", () => {
    const testStandardURLs: string[] = [
      "http://www.foo.bar",
      "www.foo.bar",
      "https://www.github.com/ibolton336/tackle-testapp.git",
    ];

    for (const url of testStandardURLs) {
      const standardTestResult = standardURLRegex.test(url);
      expect(standardTestResult).toBe(true);
    }
  });

  it("Regex should fail when validating broken standard URLs", () => {
    const testBrokenURLs: string[] = [
      "",
      " http://www.foo.bar ",
      " http://www.foo",
      " http://wrong",
      "wwwfoo.bar",
      "foo.bar",
      "www.foo.b",
      "foo.ba",
      "git@github.com:konveyor/tackle2-ui",
    ];

    for (const url of testBrokenURLs) {
      const testResult = standardURLRegex.test(url);
      expect(testResult).toBe(false);
    }
  });

  it("URL should match the same multiple times in a row", () => {
    // Motivation for this test:
    // https://stackoverflow.com/a/21373261/1183614
    // https://stackoverflow.com/a/1520853/1183614
    // When using the global flag on a regex, subsequent results will return a result from the last used index.
    // In sum, we should never be using a global flag in combination with the .test method.

    const url = "https://github.com/ibolton336/tackle-testapp.git";

    expect(standardURLRegex.test(url)).toBe(true);
    expect(standardURLRegex.test(url)).toBe(true);
    expect(standardURLRegex.test(url)).toBe(true);
    expect(standardURLRegex.test(url)).toBe(true);
    expect(standardURLRegex.test(url)).toBe(true);
  });
});
