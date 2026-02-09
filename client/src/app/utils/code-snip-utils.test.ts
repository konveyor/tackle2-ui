import { parseCodeSnip } from "./code-snip-utils";

describe("parseCodeSnip", () => {
  it("returns invalid result for empty string", () => {
    expect(parseCodeSnip("")).toEqual({ valid: false });
  });

  it("returns invalid result for whitespace-only string", () => {
    expect(parseCodeSnip("   \n  \t  ")).toEqual({ valid: false });
  });

  it("returns invalid result for null and undefined", () => {
    expect(parseCodeSnip(null)).toEqual({ valid: false });
    expect(parseCodeSnip(undefined)).toEqual({ valid: false });
  });

  it("parses a single line with line number and 2-space separator", () => {
    expect(parseCodeSnip("   1  const x = 1;")).toEqual({
      valid: true,
      startLine: 1,
      code: "const x = 1;",
      lineCount: 1,
    });
  });

  it("parses a single line with line number and no separator", () => {
    expect(parseCodeSnip("42  return foo;")).toEqual({
      valid: true,
      startLine: 42,
      code: "return foo;",
      lineCount: 1,
    });
  });

  it("parses multiple numbered lines and uses first line number as startLine", () => {
    const input = "  10  line one\n  11  line two\n  12  line three";
    expect(parseCodeSnip(input)).toEqual({
      valid: true,
      startLine: 10,
      code: "line one\nline two\nline three",
      lineCount: 3,
    });
  });

  it("skips lines without line numbers (format artifacts)", () => {
    const input = "\n  5  only this line\n";
    expect(parseCodeSnip(input)).toEqual({
      valid: true,
      startLine: 5,
      code: "only this line",
      lineCount: 1,
    });
  });

  it("includes blank source lines that have a line number", () => {
    const input = "  1  first\n  2  \n  3  third";
    expect(parseCodeSnip(input)).toEqual({
      valid: true,
      startLine: 1,
      code: "first\n\nthird",
      lineCount: 3,
    });
  });

  it("handles leading whitespace before line number", () => {
    expect(parseCodeSnip("    100  indented")).toEqual({
      valid: true,
      startLine: 100,
      code: "indented",
      lineCount: 1,
    });
  });
});
