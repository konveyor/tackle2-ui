import { type FC, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import {
  Content,
  Label,
  LabelGroup,
  LabelProps,
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
import { useFetchTokens } from "./use-tokens";
import { useFetchUsers } from "./users/use-users";

const verbToColor = (verb: string): LabelProps["color"] => {
  switch (verb.toUpperCase()) {
    case "GET":
      return "blue";
    case "POST":
      return "green";
    case "PUT":
      return "orange";
    case "DELETE":
      return "red";
    case "PATCH":
      return "purple";
    case "HEAD":
      return "teal";
  }
  return "grey";
};

const sortGetLast = (a: string, b: string) => {
  if (a.toUpperCase() === "GET") return 1;
  if (b.toUpperCase() === "GET") return -1;
  return a.toUpperCase().localeCompare(b.toUpperCase());
};

export const TokensPage: FC = () => {
  const { t } = useTranslation();

  const { tokens } = useFetchTokens();
  const { users } = useFetchUsers();
  const loginById = Object.fromEntries(
    users.map(({ id, login }) => [String(id), login])
  );

  const tableControls = useLocalTableControls({
    tableName: "tokens-table",
    idProperty: "id",
    dataNameProperty: "kind",
    items: tokens,
    columnNames: {
      id: "ID",
      login: "Login",
      kind: "Kind",
      scopes: "Scopes",
      issued: "Issued",
      expiration: "Expiration",
    },
    isFilterEnabled: true,
    isSortEnabled: true,
    isPaginationEnabled: true,
    isActiveItemEnabled: false,
    hasActionsColumn: true,
    sortableColumns: ["id", "kind"],
    initialSort: { columnKey: "id", direction: "desc" },
    getSortValues: (token) => ({
      id: token?.id?.toString() || "",
      kind: token?.kind || "",
      login: token?.user?.id ? loginById[String(token.user.id)] : "",
    }),
    filterCategories: [
      {
        categoryKey: "login",
        title: "Login",
        type: FilterType.search,
        placeholderText: "Filter by login...",
        getItemValue: (token) =>
          token?.user?.id ? loginById[String(token.user.id)] : "",
      },
      {
        categoryKey: "kind",
        title: "Kind",
        type: FilterType.search,
        placeholderText: "Filter by kind...",
        getItemValue: (token) => token?.kind || "",
      },
      {
        categoryKey: "id",
        title: "ID",
        type: FilterType.numsearch,
        placeholderText: t("actions.filterBy", { what: "ID..." }),
        getItemValue: (token) => token?.id?.toString() || "",
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

  const toCells = ({ id, kind, user, scopes, issued, expiration }: Token) => ({
    id,
    kind,
    login: user?.id ? loginById[String(user.id)] : "",
    scopes: scopes
      ?.split(" ")
      .filter(Boolean)
      .map((scope) => {
        const [resource, verb] = scope.split(":");
        return resource && verb ? [resource, verb] : [scope, ""];
      })
      .reduce(
        (acc, curr) => {
          const group = acc.find((group) => group.resource === curr[0]);
          if (group) {
            group.verbs.push(curr[1]);
          } else {
            acc.push({ resource: curr[0], verbs: [curr[1]] });
          }
          return acc;
        },
        [] as { resource: string; verbs: string[] }[]
      )
      .map((group) => (
        <LabelGroup
          key={group.resource}
          categoryName={group.resource}
          numLabels={4}
          isCompact
        >
          {group.verbs
            .filter(Boolean)
            .toSorted(sortGetLast)

            .map((verb) => (
              <Label key={verb} color={verbToColor(verb)} isCompact>
                {verb}
              </Label>
            ))}
        </LabelGroup>
      )),
    issued: issued || "-",
    expiration: expiration || "-",
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
