import React from "react";
import { useTranslation } from "react-i18next";

import { ToolbarChip } from "@patternfly/react-core";

import {
  SelectBusinessServiceFilter,
  SelectTagFilter,
} from "@app/shared/containers";
import { ApplicationFilterKey } from "@app/Constants";

import { AppTableToolbarToggleGroup } from "../app-table-toolbar-toggle-group";
import { ToolbarSearchFilter } from "../toolbar-search-filter";
import { InputTextFilter } from "../input-text-filter";

export interface IApplicationToolbarToggleGroupProps {
  value: Map<ApplicationFilterKey, ToolbarChip[]>;
  addFilter: (key: ApplicationFilterKey, value: ToolbarChip) => void;
  setFilter: (key: ApplicationFilterKey, value: ToolbarChip[]) => void;
}

export const ApplicationToolbarToggleGroup: React.FC<
  IApplicationToolbarToggleGroupProps
> = ({ value, addFilter, setFilter }) => {
  // i18
  const { t } = useTranslation();

  // Filter components
  const filterOptions = [
    {
      key: ApplicationFilterKey.NAME,
      name: t("terms.name"),
      input: (
        <InputTextFilter
          onApplyFilter={(filterText) => {
            addFilter(ApplicationFilterKey.NAME, {
              key: filterText,
              node: filterText,
            });
          }}
        />
      ),
    },
    {
      key: ApplicationFilterKey.DESCRIPTION,
      name: t("terms.description"),
      input: (
        <InputTextFilter
          onApplyFilter={(filterText) => {
            addFilter(ApplicationFilterKey.DESCRIPTION, {
              key: filterText,
              node: filterText,
            });
          }}
        />
      ),
    },
    {
      key: ApplicationFilterKey.BUSINESS_SERVICE,
      name: t("terms.businessService"),
      input: (
        <SelectBusinessServiceFilter
          value={value.get(ApplicationFilterKey.BUSINESS_SERVICE)}
          onApplyFilter={(values) => {
            setFilter(ApplicationFilterKey.BUSINESS_SERVICE, values);
          }}
        />
      ),
    },
    {
      key: ApplicationFilterKey.TAG,
      name: t("terms.tag"),
      input: (
        <SelectTagFilter
          value={value.get(ApplicationFilterKey.TAG)}
          onApplyFilter={(values) =>
            setFilter(ApplicationFilterKey.TAG, values)
          }
        />
      ),
    },
  ];

  return (
    <AppTableToolbarToggleGroup
      categories={filterOptions.map((f) => ({
        key: f.key,
        name: f.name,
      }))}
      chips={value}
      onChange={(key, value) => {
        setFilter(key as ApplicationFilterKey, value as ToolbarChip[]);
      }}
    >
      <ToolbarSearchFilter filters={filterOptions} />
    </AppTableToolbarToggleGroup>
  );
};
