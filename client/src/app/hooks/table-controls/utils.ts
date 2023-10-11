import React from "react";
import { TableFeature } from "./types";

export const handlePropagatedRowClick = <
  E extends React.KeyboardEvent | React.MouseEvent,
>(
  event: E | undefined,
  onRowClick: (event: E) => void
) => {
  // Check if there is a clickable element between the event target and the row such as a
  // checkbox, button or link. Don't trigger the row click if those are clicked.
  // This recursive parent check is necessary because the event target could be,
  // for example, the SVG icon inside a button rather than the button itself.
  const isClickableElementInTheWay = (element: Element): boolean => {
    if (["input", "button", "a"].includes(element.tagName.toLowerCase())) {
      return true;
    }
    if (
      !element.parentElement ||
      element.parentElement?.tagName.toLowerCase() === "tr"
    ) {
      return false;
    }
    return isClickableElementInTheWay(element.parentElement);
  };
  if (
    event?.target instanceof Element &&
    !isClickableElementInTheWay(event.target)
  ) {
    onRowClick(event);
  }
};

export const getFeaturesEnabledWithFallbacks = (
  featuresEnabled?: Partial<Record<TableFeature, boolean>>
) => {
  // Most tables have only filtering, sorting and pagination.
  const defaultFeaturesEnabled: Record<TableFeature, boolean> = {
    filter: true,
    sort: true,
    pagination: true,
    selection: false,
    expansion: false,
    activeRow: false,
  };
  if (!featuresEnabled) return defaultFeaturesEnabled;
  // Omitting a feature from featuresEnabled shouldn't explicitly disable it, so we need to check for undefined.
  const getFeatureEnabled = (feature: TableFeature) =>
    featuresEnabled[feature] !== undefined
      ? (featuresEnabled[feature] as boolean)
      : defaultFeaturesEnabled[feature];
  return {
    filter: getFeatureEnabled("filter"),
    sort: getFeatureEnabled("sort"),
    pagination: getFeatureEnabled("pagination"),
    selection: getFeatureEnabled("selection"),
    expansion: getFeatureEnabled("expansion"),
    activeRow: getFeatureEnabled("activeRow"),
  } satisfies Record<TableFeature, boolean>;
};
