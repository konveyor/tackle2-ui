import { AxiosError } from "axios";
import { FormGroupProps, ToolbarChip } from "@patternfly/react-core";

// Axios error

export const getAxiosErrorMessage = (axiosError: AxiosError) => {
  if (
    axiosError.response &&
    axiosError.response.data &&
    axiosError.response.data.errorMessage
  ) {
    return axiosError.response.data.errorMessage;
  } else if (
    axiosError.response?.data?.error &&
    typeof axiosError?.response?.data?.error === "string"
  ) {
    return axiosError?.response?.data?.error;
  } else {
    return axiosError.message;
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

export const dedupeFunction = (arr: any[]) =>
  arr?.filter(
    (value, index, self) =>
      index === self.findIndex((t) => t.value === value.value)
  );

export const numStr = (num: number | undefined): string => {
  if (num === undefined) return "";
  return String(num);
};

export const objectKeys = <T extends Object>(obj: T) =>
  Object.keys(obj) as (keyof T)[];

export const getValidatedFromErrors = (
  error: unknown | undefined,
  dirty: boolean | undefined
): FormGroupProps["validated"] => {
  return error && dirty ? "error" : "default";
};

export const getValidatedFromError = (
  error: unknown | undefined
): FormGroupProps["validated"] => {
  return error ? "error" : "default";
};

export const standardURLRegex =
  /(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})/gi;

export const standardStrictURLRegex =
  /https:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,4}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/gi;
