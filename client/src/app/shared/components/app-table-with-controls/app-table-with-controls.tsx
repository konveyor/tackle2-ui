import React from "react";
import { useTranslation } from "react-i18next";

import {
  Toolbar,
  ToolbarContent,
  ToolbarItem,
  ToolbarItemVariant,
} from "@patternfly/react-core";

import { AppTable, IAppTableProps } from "../app-table/app-table";
import { PaginationStateProps } from "@app/shared/hooks/useLegacyPaginationState";
import { SimplePagination } from "../simple-pagination";

export interface IAppTableWithControlsProps extends IAppTableProps {
  count: number;
  withoutTopPagination?: boolean;
  withoutBottomPagination?: boolean;
  toolbarBulkSelector?: any;
  toolbarToggle?: any;
  toolbarActions?: any;
  toolbarClearAllFilters?: () => void;
  paginationProps: PaginationStateProps;
  paginationIdPrefix?: string;
}

export const AppTableWithControls: React.FC<IAppTableWithControlsProps> = ({
  count,
  withoutTopPagination,
  withoutBottomPagination,
  toolbarBulkSelector,
  toolbarToggle,
  toolbarActions,
  toolbarClearAllFilters,
  paginationProps,
  paginationIdPrefix,
  ...rest
}) => {
  const { t } = useTranslation();

  return (
    <div
      style={{
        backgroundColor: "var(--pf-v5-global--BackgroundColor--100)",
      }}
    >
      <Toolbar
        className="pf-m-toggle-group-container"
        collapseListedFiltersBreakpoint="xl"
        clearAllFilters={toolbarClearAllFilters}
        clearFiltersButtonText={t("actions.clearAllFilters")}
      >
        <ToolbarContent>
          {toolbarBulkSelector}
          {toolbarToggle ? toolbarToggle : null}
          {toolbarActions}
          {!withoutTopPagination && (
            <ToolbarItem
              variant={ToolbarItemVariant.pagination}
              align={{ default: "alignRight" }}
            >
              <SimplePagination
                idPrefix={paginationIdPrefix}
                isTop={true}
                paginationProps={paginationProps}
              />
            </ToolbarItem>
          )}
        </ToolbarContent>
      </Toolbar>
      <AppTable {...rest} />
      {!withoutBottomPagination && (
        <SimplePagination
          idPrefix={paginationIdPrefix}
          isTop={false}
          paginationProps={paginationProps}
        />
      )}
    </div>
  );
};
