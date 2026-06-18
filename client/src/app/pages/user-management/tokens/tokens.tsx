import { type FC, ReactNode, useState } from "react";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import {
  Button,
  Checkbox,
  Content,
  PageSection,
  Toolbar,
  ToolbarContent,
  ToolbarGroup,
  ToolbarItem,
  Tooltip,
} from "@patternfly/react-core";
import {
  ActionsColumn,
  ExpandableRowContent,
  Table,
  Tbody,
  Td,
  Th,
  ThProps,
  Thead,
  Tr,
} from "@patternfly/react-table";

import { Token } from "@app/api/models";
import { FilterToolbar, FilterType } from "@app/components/FilterToolbar";
import { NoDataEmptyState } from "@app/components/NoDataEmptyState";
import { SimplePagination } from "@app/components/SimplePagination";
import {
  ConditionalTableBody,
  TableHeaderContentWithControls,
  TableRowContentWithControls,
} from "@app/components/TableControls";
import { useLocalTableControls } from "@app/hooks/table-controls";
import { useFetchTokens } from "@app/queries/tokens";
import { useFetchUsers } from "@app/queries/users";
import { ScopeGate, tokensCreateScopes, tokensDeleteScopes } from "@app/scopes";

import { ManageColumnsToolbar } from "../../applications/applications-table/components/manage-columns-toolbar";
import { DateCell } from "../components/date-cell";
import { ScopeLabels, groupScopes } from "../components/scope-labels";

import { TokenCreateModal } from "./token-modal";
import { useTokenActionsWithNotifications } from "./use-tokens";

const kindCategory = (kind: string) => {
  if (kind === "access") return "access";
  if (kind === "api-key") return "api-key";
  return "other";
};

const isExpired = (token: Token) => {
  if (!token.expiration) return false;
  return dayjs(token.expiration).isBefore(dayjs());
};

const getLogin = (
  id: number | undefined,
  loginById: Record<string, string>
) => {
  return id !== undefined ? loginById[String(id)] : "";
};

export const TokensPage: FC = () => {
  const { t } = useTranslation();

  const { tokens, isLoading, fetchError } = useFetchTokens();
  const { revokeToken } = useTokenActionsWithNotifications();
  const { users } = useFetchUsers();
  const [createOpen, setCreateOpen] = useState(false);
  const [showExpired, setShowExpired] = useState(false);

  const loginById = Object.fromEntries(
    users.map(({ id, login }) => [String(id), login])
  );

  const visibleTokens = showExpired
    ? tokens
    : tokens.filter((token) => !isExpired(token));

  const tableControls = useLocalTableControls({
    tableName: "tokens-table",
    idProperty: "id",
    dataNameProperty: "kind",
    items: visibleTokens,
    columnNames: {
      id: "ID",
      login: "Login",
      kind: "Kind",
      scopes: "Scopes",
      issued: "Issued",
      expiration: "Expiration",
      lifespan: "Lifespan(hours)",
    },
    isFilterEnabled: true,
    isSortEnabled: true,
    isPaginationEnabled: true,
    isActiveItemEnabled: false,
    isExpansionEnabled: true,
    expandableVariant: "compound",
    hasActionsColumn: true,
    sortableColumns: ["id", "kind", "issued", "expiration", "lifespan"],
    initialSort: { columnKey: "id", direction: "desc" },
    getSortValues: (token: Token) => ({
      id: token?.id ?? "",
      kind: token?.kind ?? "",
      login: getLogin(token?.user?.id, loginById),
      expiration: token?.expiration ?? "",
      issued: token?.issued ?? "",
      lifespan: token?.lifespan ?? "",
    }),
    filterCategories: [
      {
        categoryKey: "login",
        title: "Login",
        type: FilterType.search,
        placeholderText: "Filter by login...",
        getItemValue: (token) => getLogin(token?.user?.id, loginById),
      },
      {
        categoryKey: "kind",
        title: "Kind",
        type: FilterType.multiselect,
        selectOptions: [
          { value: "access", label: t("terms.tokenKindAccess") },
          { value: "api-key", label: t("terms.tokenKindApi") },
          { value: "other", label: t("terms.tokenKindOther") },
        ],
        getItemValue: (token) => kindCategory(token?.kind || ""),
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
      getExpandedContentTdProps,
    },
    expansionDerivedState: { isCellExpanded },
    columnState,
  } = tableControls;

  const tooltips: Record<string, ThProps["info"]> = {};

  const toCells = ({
    id,
    kind,
    user,
    scopes,
    issued,
    expiration,
    lifespan,
  }: Token) => ({
    id,
    kind,
    login: getLogin(user?.id, loginById),
    scopes: scopes?.length ?? 0,
    issued: <DateCell raw={issued} />,
    expiration: <DateCell raw={expiration} />,
    lifespan: lifespan ?? "",
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
            <ToolbarItem alignSelf="center">
              <Checkbox
                id="show-expired-tokens"
                label={t("terms.showExpiredTokens")}
                isChecked={showExpired}
                onChange={(_event, checked) => setShowExpired(checked)}
              />
            </ToolbarItem>
            <ScopeGate requiredScopes={tokensCreateScopes}>
              <ToolbarGroup variant="action-group">
                <ToolbarItem>
                  <Button
                    variant="primary"
                    aria-label={t("actions.createApiKey")}
                    onClick={() => setCreateOpen(true)}
                  >
                    {t("actions.createApiKey")}
                  </Button>
                </ToolbarItem>
              </ToolbarGroup>
            </ScopeGate>
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
          ouiaId="tokens-table"
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
            isNoData={visibleTokens.length === 0}
            isLoading={isLoading}
            isError={!!fetchError}
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
                  <>
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
                              {...getTdProps({
                                columnKey,
                                isCompoundExpandToggle: columnKey === "scopes",
                                item: token,
                                rowIndex,
                              })}
                            >
                              {cells[columnKey]}
                            </Td>
                          ))}
                        <Td isActionCell>
                          <ScopeGate requiredScopes={tokensDeleteScopes}>
                            <ActionsColumn
                              items={[
                                {
                                  title: t("actions.revoke"),
                                  onClick: () => revokeToken(token),
                                  isDanger: true,
                                },
                              ]}
                            />
                          </ScopeGate>
                        </Td>
                      </TableRowContentWithControls>
                    </Tr>
                    {isCellExpanded(token) ? (
                      <Tr isExpanded key={`${token.id}-expanded`}>
                        <Td />
                        <Td
                          colSpan={numRenderedColumns - 1}
                          {...getExpandedContentTdProps({ item: token })}
                        >
                          <ExpandableRowContent>
                            {groupScopes(token?.scopes ?? []).map((group) => (
                              <ScopeLabels key={group.resource} group={group} />
                            ))}
                          </ExpandableRowContent>
                        </Td>
                      </Tr>
                    ) : null}
                  </>
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
      <TokenCreateModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
      />
    </>
  );
};

export default TokensPage;
