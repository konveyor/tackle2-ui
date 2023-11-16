import { AxiosError } from "axios";
import {
  getAxiosErrorMessage,
  getValidatedFromError,
  getValidatedFromErrors,
  getToolbarChipKey,
  gitUrlRegex,
  standardURLRegex,
  formatPath,
  extractFirstSha,
} from "./utils";
import { Paths } from "@app/Paths";

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
    const isTouched = true;

    const status = getValidatedFromErrors(error, dirty, isTouched);
    expect(status).toBe("error");
  });

  it("getValidatedFromErrors: given 'error' but not 'touched' return 'default'", () => {
    const error = "Any value";
    const dirty = false;
    const isTouched = false;

    const status = getValidatedFromErrors(error, dirty, isTouched);
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

describe("formatPath function", () => {
  it("should replace path parameters with values", () => {
    const path = Paths.applicationsImportsDetails;
    const data = { importId: "import123" };
    const result = formatPath(path, data);

    expect(result).toBe("/applications/application-imports/import123");
  });

  it("should handle missing data", () => {
    const path = Paths.applicationsAssessment;
    const data = {};
    const result = formatPath(path, data);

    expect(result).toBe("/applications/assessment/:assessmentId");
  });
});

describe("SHA extraction", () => {
  it("empty string is undefined", () => {
    const first = extractFirstSha("");
    expect(first).toBeUndefined();
  });

  it("no SHA is undefined", () => {
    const first = extractFirstSha(
      "The quick brown fox jumps over the lazy dog."
    );
    expect(first).toBeUndefined();
  });

  it("a SHA is found", () => {
    const tests = [
      "83cd2cd674a217ade95a4bb83a8a14f351f48bd0",
      "           83cd2cd674a217ade95a4bb83a8a14f351f48bd0            ",
      "83cd2cd674a217ade95a4bb83a8a14f351f48bd0  The quick brown fox jumps over the lazy dog.",
      "The quick brown fox jumps over the lazy dog.  83cd2cd674a217ade95a4bb83a8a14f351f48bd0",
      "The quick brown fox 83cd2cd674a217ade95a4bb83a8a14f351f48bd0 jumps over the lazy dog.",
    ];

    for (const test of tests) {
      const first = extractFirstSha(test);
      expect(first).toBe("83cd2cd674a217ade95a4bb83a8a14f351f48bd0");
    }
  });

  it("multiple SHAs are in the string, only the first is returned", () => {
    const first = extractFirstSha(
      "83cd2cd674a217ade95a4bb83a8a14f351f48bd0 9c04cd6372077e9b11f70ca111c9807dc7137e4b"
    );
    expect(first).toBe("83cd2cd674a217ade95a4bb83a8a14f351f48bd0");
  });

  it("multiple SHAs are in the string, only the first is returned even if it is shorter", () => {
    const first = extractFirstSha(
      "9c04cd6372077e9b11f70ca111c9807dc7137e4b 83cd2cd674a217ade95a4bb83a8a14f351f48bd0 b47cc0f104b62d4c7c30bcd68fd8e67613e287dc4ad8c310ef10cbadea9c4380"
    );
    expect(first).toBe("9c04cd6372077e9b11f70ca111c9807dc7137e4b");
  });
});
