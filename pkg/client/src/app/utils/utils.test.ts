import { AxiosError } from "axios";
import {
  getAxiosErrorMessage,
  getValidatedFromError,
  getValidatedFromErrorTouched,
  getToolbarChipKey,
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

  it("getValidatedFromErrorTouched: given 'error' and 'touched' return 'error'", () => {
    const error = "Any value";
    const touched = true;

    const status = getValidatedFromErrorTouched(error, touched);
    expect(status).toBe("error");
  });

  it("getValidatedFromErrorTouched: given 'error' but not 'touched' return 'default'", () => {
    const error = "Any value";
    const touched = false;

    const status = getValidatedFromErrorTouched(error, touched);
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
});
