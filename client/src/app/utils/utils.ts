import { AxiosError } from "axios";
import { ToolbarChip } from "@patternfly/react-core";
import gitUrlParse from "git-url-parse";

import { AdminPathValues, DevPathValues } from "@app/Paths";
import i18n from "@app/i18n";

// Axios error

export const getAxiosErrorMessage = (axiosError: AxiosError) => {
  if (axiosError.response && axiosError.response.data && axiosError.message) {
    return axiosError.message;
  } else {
    return "Network error";
  }
};

// ToolbarChip

export const getToolbarChipKey = (value: string | ToolbarChip) => {
  return typeof value === "string" ? value : value.key;
};

// Dates

export const formatDate = (value: Date, includeTime = true) => {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const dateOptions: Intl.DateTimeFormatOptions = {
    timeZone,
    timeZoneName: "short",
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  const timeOptions = {
    timeZone,
    timeZoneName: "short",
    hour: "2-digit",
    minute: "2-digit",
  };

  let options = dateOptions;
  if (includeTime) {
    options = Object.assign({}, dateOptions, timeOptions);
  }

  return value.toLocaleDateString("en", options);
};

export const duplicateFieldCheck = <T>(
  fieldKey: keyof T,
  itemList: T[],
  currentItem: T | null,
  fieldValue: T[keyof T]
) =>
  (currentItem && currentItem[fieldKey] === fieldValue) ||
  !itemList.some((item) => item[fieldKey] === fieldValue);

export const duplicateNameCheck = <T extends { name?: string }>(
  itemList: T[],
  currentItem: T | null,
  nameValue: T["name"]
) => duplicateFieldCheck("name", itemList, currentItem, nameValue);

export const dedupeFunction = <T extends { value: unknown }>(arr: T[]) =>
  arr?.filter(
    (value, index, self) =>
      index === self.findIndex((t) => t.value === value.value)
  );

export const dedupeArrayOfObjects = <T>(arr: Array<T>, key: keyof T) => {
  const seen = new Set();
  return arr.filter((item) => {
    const value = item[key];
    if (seen.has(value)) {
      return false;
    }
    seen.add(value);
    return true;
  });
};

export const numStr = (num: number | undefined): string => {
  if (num === undefined) return "";
  return String(num);
};

export const parseMaybeNumericString = (
  numOrStr: string | undefined | null
): string | number | null => {
  if (numOrStr === undefined || numOrStr === null) return null;
  const num = Number(numOrStr);
  return isNaN(num) ? numOrStr : num;
};

export const objectKeys = <T extends object>(obj: T) =>
  Object.keys(obj) as (keyof T)[];

export const getValidatedFromErrors = (
  error: unknown | undefined,
  dirty: boolean | undefined,
  isTouched: boolean | undefined
) => {
  return error && (dirty || isTouched) ? "error" : "default";
};

export const getValidatedFromError = (error: unknown | undefined) => {
  return error ? "error" : "default";
};

const standardURLRegex =
  /^(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.\S{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.\S{2,}|www\.[a-zA-Z0-9]+\.\S{2,})$/;

export const isValidStandardUrl = (url: string) => standardURLRegex.test(url);

export const standardStrictURLRegex =
  /https:\/\/(www\.)?[-a-zA-Z0-9@:%._\\+~#=]{2,256}\.[a-z]{2,4}\b([-a-zA-Z0-9@:%_\\+.~#?&//=]*)/;

export const isValidGitUrl = (url: string): boolean => {
  try {
    const r = gitUrlParse(url.at(-1) === "/" ? url.slice(0, -1) : url);
    return /^(ssh|git|http|https)$/.test(r.protocol) && !!r.host;
  } catch {
    return false;
  }
};

const svnUrlRegex = /^svn:\/\/[\S/$.?#].\S*$/;

export const isValidSvnUrl = (url: string) =>
  svnUrlRegex.test(url) || isValidStandardUrl(url);

export const formatPath = (
  path: AdminPathValues | DevPathValues,
  data: Record<string, unknown>
) => {
  let url = path as string;

  for (const k of Object.keys(data)) {
    const regex = new RegExp(`:${k}(/|$)`, "g");
    url = url.replace(regex, data[k] + "$1");
  }

  return url;
};

/**
 * Regular expression to match a SHA hash in a string.  Different versions of the SHA
 * hash have different lengths.  Check in descending length order so the longest SHA
 * string can be captured.
 */
const SHA_REGEX =
  /([a-f0-9]{128}|[a-f0-9]{96}|[a-f0-9]{64}|[a-f0-9]{56}|[a-f0-9]{40})/g;

/**
 * In any given string, find the first thing that looks like a sha hash and return it.
 * If nothing looks like a sha hash, return undefined.
 */
export const extractFirstSha = (str: string): string | undefined => {
  const match = str.match(SHA_REGEX);
  return match && match[0] ? match[0] : undefined;
};

export const collapseSpacesAndCompare = (
  str1: string | undefined,
  str2: string | undefined,
  locale?: string
): number => {
  if (!str1 && !str2) {
    return 0;
  }
  if (str1 && !str2) {
    return 1;
  }
  if (!str1 && str2) {
    return -1;
  }

  const a = str1?.trim().replace(/\s+/g, " ") ?? "";
  const b = str2?.trim().replace(/\s+/g, " ") ?? "";

  return a.localeCompare(b, locale);
};

export const capitalizeFirstLetter = (str: string) =>
  str.charAt(0).toUpperCase() + str.slice(1);

/**
 * Uses native string localCompare method with numeric option enabled.
 *
 * @param locale to be used by string compareFn
 */
export const localeNumericCompare = (
  a: string,
  b: string,
  locale: string = i18n.language
): number => a.localeCompare(b, locale ?? "en", { numeric: true });

export const getString = (input: string | (() => string)) =>
  typeof input === "function" ? input() : input;

/**
 * Compares all types by converting them to string.
 * Nullish entities are converted to empty string.
 * @see localeNumericCompare
 * @param locale to be used by string compareFn
 */
export const universalComparator = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  a: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  b: any,
  locale: string = i18n.language
) => localeNumericCompare(String(a ?? ""), String(b ?? ""), locale);
