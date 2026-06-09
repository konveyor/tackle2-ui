import { type FC, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import {
  Content,
  PageSection,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
} from "@patternfly/react-core";
import {
  ActionsColumn,
  Table,
  Tbody,
  Td,
  Th,
  ThProps,
  Thead,
  Tr,
} from "@patternfly/react-table";

import { FilterToolbar, FilterType } from "@app/components/FilterToolbar";
import { NoDataEmptyState } from "@app/components/NoDataEmptyState";
import { SimplePagination } from "@app/components/SimplePagination";
import {
  ConditionalTableBody,
  TableHeaderContentWithControls,
  TableRowContentWithControls,
} from "@app/components/TableControls";
import { useLocalTableControls } from "@app/hooks/table-controls";

import { ManageColumnsToolbar } from "../applications/applications-table/components/manage-columns-toolbar";

import { Token } from "./types";
import { useTokens } from "./use-tokens";

export const TokensPage: FC = () => {
  const { t } = useTranslation();

  const tokens = useTokens();
  const tableControls = useLocalTableControls({
    tableName: "tokens-table",
    idProperty: "id",
    dataNameProperty: "kind",
    items: tokens,
    columnNames: {
      id: "ID",
      kind: "Kind",
      subject: "Subject",
      scopes: "Scopes",
      issued: "Issued",
      expiration: "Expiration",
      lifespan: "Lifespan (h)",
    },
    isFilterEnabled: true,
    isSortEnabled: true,
    isPaginationEnabled: true,
    isActiveItemEnabled: false,
    hasActionsColumn: true,
    sortableColumns: ["id", "kind", "subject"],
    initialSort: { columnKey: "id", direction: "desc" },
    getSortValues: (token) => ({
      id: token?.id?.toString() || "",
      kind: token?.kind || "",
      subject: token?.subject || "",
    }),
    filterCategories: [
      {
        categoryKey: "id",
        title: "ID",
        type: FilterType.numsearch,
        placeholderText: t("actions.filterBy", { what: "ID..." }),
        getItemValue: (token) => token?.id?.toString() || "",
      },
      {
        categoryKey: "kind",
        title: "Kind",
        type: FilterType.search,
        placeholderText: "Filter by kind...",
        getItemValue: (token) => token?.kind || "",
      },
      {
        categoryKey: "subject",
        title: "Subject",
        type: FilterType.search,
        placeholderText: "Filter by subject...",
        getItemValue: (token) => token?.subject || "",
      },
    ],
    initialItemsPerPage: 10,
  });

  const {
    currentPageItems,
    numRenderedColumns,
    propHelpers: {
      toolbarProps,
      filterToolbarProps,
      paginationToolbarItemProps,
      paginationProps,
      tableProps,
      getThProps,
      getTrProps,
      getTdProps,
      getColumnVisibility,
    },
    columnState,
  } = tableControls;

  const tooltips: Record<string, ThProps["info"]> = {};

  const toCells = ({
    id,
    kind,
    subject,
    scopes,
    issued,
    expiration,
    lifespan,
  }: Token) => ({
    id,
    kind,
    subject: subject || "-",
    scopes: scopes || "-",
    issued: issued || "-",
    expiration: expiration || "-",
    lifespan: lifespan ?? "-",
  });

  return (
    <>
      <PageSection hasBodyWrapper={false}>
        <Content>
          <Content component="h1">{t("titles.tokens")}</Content>
        </Content>
      </PageSection>
      <PageSection hasBodyWrapper={false}>
        <Toolbar {...toolbarProps}>
          <ToolbarContent>
            <FilterToolbar {...filterToolbarProps} />
            <ManageColumnsToolbar
              columns={columnState.columns}
              setColumns={columnState.setColumns}
              defaultColumns={columnState.defaultColumns}
            />
            <ToolbarItem {...paginationToolbarItemProps}>
              <SimplePagination
                idPrefix="tokens-table"
                isTop
                paginationProps={paginationProps}
              />
            </ToolbarItem>
          </ToolbarContent>
        </Toolbar>

        <Table
          {...tableProps}
          id="tokens-table"
          aria-label={t("titles.tokenTable")}
        >
          <Thead>
            <Tr>
              <TableHeaderContentWithControls {...tableControls}>
                {columnState.columns
                  .filter(({ id }) => getColumnVisibility(id))
                  .map(({ id }) => (
                    <Th
                      key={id}
                      {...getThProps({ columnKey: id })}
                      info={tooltips[id]}
                    />
                  ))}
                <Th screenReaderText={t("actions.rowActions")} />
              </TableHeaderContentWithControls>
            </Tr>
          </Thead>
          <ConditionalTableBody
            isNoData={tokens.length === 0}
            noDataEmptyState={
              <NoDataEmptyState title={t("message.noTokensFoundTitle")} />
            }
            numRenderedColumns={numRenderedColumns}
          >
            <Tbody>
              {currentPageItems
                .map((token): [Token, { [p: string]: ReactNode }] => [
                  token,
                  toCells(token),
                ])
                .map(([token, cells], rowIndex) => (
                  <Tr key={token.id} {...getTrProps({ item: token })}>
                    <TableRowContentWithControls
                      {...tableControls}
                      item={token}
                      rowIndex={rowIndex}
                    >
                      {columnState.columns
                        .filter(({ id }) => getColumnVisibility(id))
                        .map(({ id: columnKey }) => (
                          <Td
                            key={`${columnKey}_${token.id}`}
                            {...getTdProps({ columnKey })}
                          >
                            {cells[columnKey]}
                          </Td>
                        ))}
                      <Td isActionCell>
                        <ActionsColumn
                          items={[
                            {
                              title: t("actions.delete"),
                              onClick: () => console.log("delete token"),
                              isDanger: true,
                            },
                          ]}
                        />
                      </Td>
                    </TableRowContentWithControls>
                  </Tr>
                ))}
            </Tbody>
          </ConditionalTableBody>
        </Table>
        <SimplePagination
          idPrefix="tokens-table"
          isTop={false}
          paginationProps={paginationProps}
        />
      </PageSection>
    </>
  );
};

export default TokensPage;
