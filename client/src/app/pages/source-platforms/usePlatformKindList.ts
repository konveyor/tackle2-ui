import { OptionWithValue } from "@app/components/SimpleSelect";
import React from "react";

export const DEFAULT_KIND = "cloudfoundry";

// Extend this map as new platform kinds are added
const KIND_MAP = {
  cloudfoundry: {
    label: "Cloud Foundry",
  },
} as const;

export const usePlatformKindList = (): {
  kinds: OptionWithValue<string>[];
  getDisplayLabel: (kind?: string | null) => string;
} => {
  const kinds: OptionWithValue<string>[] = React.useMemo(
    () =>
      Object.entries(KIND_MAP).map(([key, values]) => ({
        value: key,
        toString: () => values.label,
      })),
    []
  );

  const getDisplayLabel = React.useCallback((kind?: string | null): string => {
    if (!kind) return "";
    const map = KIND_MAP as Record<string, { label: string }>;
    const entry = map[kind];
    if (entry?.label) {
      return entry.label;
    }
    return kind;
  }, []);

  return { kinds, getDisplayLabel };
};
