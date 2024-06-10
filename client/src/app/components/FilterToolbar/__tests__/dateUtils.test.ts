import {
  isInClosedRange,
  isValidAmericanShortDate,
  isValidInterval,
  parseInterval,
  toISODateInterval,
  localizeInterval,
} from "../dateUtils";

describe("isValidAmericanShortDate", () => {
  test("short format: 10/31/2023", () =>
    expect(isValidAmericanShortDate("10/31/2023")).toBeTruthy());

  test("invalid string", () =>
    expect(isValidAmericanShortDate("31/broken10/2023")).toBeFalsy());

  test("invalid number of days", () =>
    expect(isValidAmericanShortDate("06/60/2022")).toBeFalsy());
});

describe("isInClosedRange(no time, no zone)", () => {
  test("date is lower bound", () =>
    expect(
      isInClosedRange("2023-10-30/2023-10-31", "2023-10-30")
    ).toBeTruthy());

  test("date is upper bound", () =>
    expect(
      isInClosedRange("2023-10-30/2023-10-31", "2023-10-31")
    ).toBeTruthy());

  test("date after range", () =>
    expect(isInClosedRange("2023-10-30/2023-10-31", "2023-11-01")).toBeFalsy());

  test("date before range", () =>
    expect(isInClosedRange("2023-10-31/2023-11-01", "2023-10-30")).toBeFalsy());
});

describe("isInClosedRange(full ISO with zone)", () => {
  test("date in range(positive TZ offset)", () =>
    expect(
      isInClosedRange("2023-10-30/2023-10-31", "2023-11-01T01:30:00.000+02:00")
    ).toBeTruthy());

  test("date after range (negative TZ offset)", () =>
    expect(
      isInClosedRange("2023-10-30/2023-10-31", "2023-10-31T22:30:00.000-02:00")
    ).toBeFalsy());

  test("date before range", () =>
    expect(
      isInClosedRange("2023-10-31/2023-11-01", "2023-10-31T01:30:00.000+02:00")
    ).toBeFalsy());
});

describe("isValidInterval", () => {
  test("2023-10-30/2023-10-31", () =>
    expect(
      isValidInterval(parseInterval("2023-10-30/2023-10-31"))
    ).toBeTruthy());

  test("invalid format", () =>
    expect(
      isValidInterval(parseInterval("2023-foo-30/2023-10-31"))
    ).toBeFalsy());

  test("invalid days", () =>
    expect(
      isValidInterval(parseInterval("2023-10-60/2023-10-31"))
    ).toBeFalsy());
});

describe("toISODateInterval", () => {
  test("unix epoch as start and end", () =>
    expect(toISODateInterval(new Date(0), new Date(0))).toBe(
      "1970-01-01/1970-01-01"
    ));
});

describe("localizeInterval", () => {
  test("2023-10-30/2023-10-31", () =>
    expect(localizeInterval("2023-10-30/2023-10-31")).toEqual([
      "10/30-10/31",
      "10/30/2023-10/31/2023",
    ]));
});
