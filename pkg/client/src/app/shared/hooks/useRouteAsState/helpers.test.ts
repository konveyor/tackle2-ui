import {
  getQueryParamsAsObject,
  removeUndefined,
  objectToQueryParams,
  encodeValues,
} from "./helpers";

describe("Helpers", () => {
  it("getQueryParamsAsObject", () => {
    const result = getQueryParamsAsObject("?a=1&b=2&b=3&c");

    expect(result).toMatchObject({
      a: ["1"],
      b: ["2", "3"],
    });
  });

  it("removeUndefined", () => {
    const result = removeUndefined({
      a: "1",
      b: 1,
      c: undefined,
      d: true,
    });

    expect(result).toMatchObject({
      a: "1",
      b: 1,
      d: true,
    });
  });

  it("objectToQueryParams", () => {
    const result = objectToQueryParams({
      a: "1",
      b: ["x", "y"],
    });

    expect(result).toBe("?a=1&b=x&b=y");
  });

  it("encodeValues", () => {
    const result = encodeValues({
      a: ["red car", "big house"],
      b: ["one", "two"],
    });

    expect(result).toMatchObject({
      a: ["red%20car", "big%20house"],
      b: ["one", "two"],
    });
  });
});
