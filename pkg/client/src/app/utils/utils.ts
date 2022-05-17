import { AxiosError } from "axios";
import { ToolbarChip } from "@patternfly/react-core";

// Axios error

export const getAxiosErrorMessage = (axiosError: AxiosError) => {
  if (
    axiosError.response &&
    axiosError.response.data &&
    axiosError.response.data.errorMessage
  ) {
    return axiosError.response.data.errorMessage;
  } else {
    return axiosError.message;
  }
};

// Formik

export const getValidatedFromError = (
  error: any
): "success" | "warning" | "error" | "default" => {
  return error ? "error" : "default";
};

export const getValidatedFromErrorTouched = (
  error: any,
  touched: any
): "success" | "warning" | "error" | "default" => {
  return error && touched ? "error" : "default";
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

export const dedupeFunction = (arr) =>
  arr?.filter(
    (value, index, self) =>
      index === self.findIndex((t) => t.value === value.value)
  );

export const numStr = (num: number | undefined): string => {
  if (num === undefined) return "";
  return String(num);
};
