import React from "react";
import { useTranslation } from "react-i18next";

import {
  Drawer,
  DrawerActions,
  DrawerCloseButton,
  DrawerContent,
  DrawerContentBody,
  DrawerHead,
  DrawerPanelContent,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
  ToolbarItemVariant,
} from "@patternfly/react-core";

import { AppTable, IAppTableProps } from "../app-table/app-table";
import { PaginationStateProps } from "@app/shared/hooks/usePaginationState";
import { SimplePagination } from "../simple-pagination";
import { Application } from "@app/api/models";
import { PageDrawerContentPortal } from "@app/shared/page-drawer-context";

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
  activeAppInDetailDrawer: Application | null;
  closeDetailDrawer: () => void;
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
  activeAppInDetailDrawer,
  closeDetailDrawer,
  ...rest
}) => {
  const { t } = useTranslation();

  return (
    <div
      style={{
        backgroundColor: "var(--pf-global--BackgroundColor--100)",
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
              alignment={{ default: "alignRight" }}
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
      <PageDrawerContentPortal
        isExpanded={!!activeAppInDetailDrawer}
        onCloseClick={closeDetailDrawer}
      >
        <h1>TODO: content about app "{activeAppInDetailDrawer?.name}"</h1>
      </PageDrawerContentPortal>
    </div>
  );
};
