import { FC, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Button,
  DualListSelector,
  DualListSelectorControl,
  DualListSelectorControlsWrapper,
  DualListSelectorList,
  DualListSelectorListItem,
  DualListSelectorPane,
  SearchInput,
} from "@patternfly/react-core";
import {
  AngleDoubleLeftIcon,
  AngleDoubleRightIcon,
  AngleLeftIcon,
  AngleRightIcon,
} from "@patternfly/react-icons";

import { SimpleEmptyState } from "@app/components/SimpleEmptyState";

const toggleSet = (
  set: Set<string>,
  setState: React.Dispatch<React.SetStateAction<Set<string>>>,
  value: string
) => {
  const next = new Set(set);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  setState(next);
};

export interface DualScopesListProps {
  chosenScopes: string[];
  onChange: (chosenScopes: string[]) => void;
  allScopes: string[];
}

export const DualScopesList: FC<DualScopesListProps> = ({
  chosenScopes,
  onChange,
  allScopes,
}) => {
  const { t } = useTranslation();

  const [availableFilter, setAvailableFilter] = useState("");
  const [chosenFilter, setChosenFilter] = useState("");
  const [availableSelected, setAvailableSelected] = useState<Set<string>>(
    new Set()
  );
  const [chosenSelected, setChosenSelected] = useState<Set<string>>(new Set());

  const matchesFilter = (scope: string, filter: string) =>
    !filter || scope.toLowerCase().includes(filter.toLowerCase());

  const availableScopes = allScopes.filter(
    (scope) => !chosenScopes.includes(scope)
  );

  // show already selected to avoid silent modifications
  const visibleAvailable = availableScopes.filter(
    (scope) =>
      matchesFilter(scope, availableFilter) || availableSelected.has(scope)
  );
  const visibleChosen = chosenScopes.filter(
    (scope) => matchesFilter(scope, chosenFilter) || chosenSelected.has(scope)
  );

  const moveToChosen = (items: string[]) => {
    onChange([...chosenScopes, ...items]);
    setAvailableSelected(new Set());
  };
  const moveToAvailable = (items: string[]) => {
    const removeScopes = new Set(items);
    onChange(chosenScopes.filter((scope) => !removeScopes.has(scope)));
    setChosenSelected(new Set());
  };
  const moveAllVisibleToChosen = () => {
    onChange([...chosenScopes, ...visibleAvailable]);
    setAvailableSelected(new Set());
  };
  const moveAllVisibleToAvailable = () => {
    const removeScopes = new Set(visibleChosen);
    onChange(chosenScopes.filter((scope) => !removeScopes.has(scope)));
    setChosenSelected(new Set());
  };
  const numAvailSel = visibleAvailable.filter((scope) =>
    availableSelected.has(scope)
  ).length;
  const numChosenSel = visibleChosen.filter((scope) =>
    chosenSelected.has(scope)
  ).length;

  return (
    <DualListSelector>
      <DualListSelectorPane
        title={t("terms.availableScopes")}
        status={t("message.selectedOptions", {
          count: numAvailSel,
          total: visibleAvailable.length,
        })}
        searchInput={
          <SearchInput
            value={availableFilter}
            onChange={(_event, value) => setAvailableFilter(value)}
            onClear={() => setAvailableFilter("")}
            aria-label={t("message.searchAvailableScopes")}
          />
        }
        listMinHeight="300px"
      >
        {availableFilter && visibleAvailable.length === 0 && (
          <SimpleEmptyState
            title={t("message.noResultsFoundTitle")}
            description={t("message.noResultsFoundBody")}
            primaryAction={
              <Button variant="link" onClick={() => setAvailableFilter("")}>
                {t("actions.clearAllFilters")}
              </Button>
            }
          />
        )}

        <DualListSelectorList>
          {visibleAvailable.map((scope) => (
            <DualListSelectorListItem
              key={scope}
              isSelected={availableSelected.has(scope)}
              onOptionSelect={() =>
                toggleSet(availableSelected, setAvailableSelected, scope)
              }
            >
              {scope}
            </DualListSelectorListItem>
          ))}
        </DualListSelectorList>
      </DualListSelectorPane>

      <DualListSelectorControlsWrapper>
        <DualListSelectorControl
          isDisabled={numAvailSel === 0}
          onClick={() =>
            moveToChosen(
              visibleAvailable.filter((scope) => availableSelected.has(scope))
            )
          }
          aria-label={t("actions.addSelected")}
          tooltipContent={t("actions.addSelected")}
        >
          <AngleRightIcon />
        </DualListSelectorControl>
        <DualListSelectorControl
          isDisabled={visibleAvailable.length === 0}
          onClick={moveAllVisibleToChosen}
          aria-label={t("actions.addAll")}
          tooltipContent={t("actions.addAll")}
        >
          <AngleDoubleRightIcon />
        </DualListSelectorControl>
        <DualListSelectorControl
          isDisabled={numChosenSel === 0}
          onClick={() =>
            moveToAvailable(
              visibleChosen.filter((scope) => chosenSelected.has(scope))
            )
          }
          aria-label={t("actions.removeSelected")}
          tooltipContent={t("actions.removeSelected")}
        >
          <AngleLeftIcon />
        </DualListSelectorControl>
        <DualListSelectorControl
          isDisabled={visibleChosen.length === 0}
          onClick={moveAllVisibleToAvailable}
          aria-label={t("actions.removeAll")}
          tooltipContent={t("actions.removeAll")}
        >
          <AngleDoubleLeftIcon />
        </DualListSelectorControl>
      </DualListSelectorControlsWrapper>

      <DualListSelectorPane
        title={t("terms.chosenScopes")}
        status={t("message.selectedOptions", {
          count: numChosenSel,
          total: visibleChosen.length,
        })}
        searchInput={
          <SearchInput
            value={chosenFilter}
            onChange={(_event, value) => setChosenFilter(value)}
            onClear={() => setChosenFilter("")}
            aria-label={t("message.searchChosenScopes")}
          />
        }
        listMinHeight="300px"
        isChosen
      >
        {chosenFilter && visibleChosen.length === 0 && (
          <SimpleEmptyState
            title={t("message.noResultsFoundTitle")}
            description={t("message.noResultsFoundBody")}
            primaryAction={
              <Button variant="link" onClick={() => setChosenFilter("")}>
                {t("actions.clearAllFilters")}
              </Button>
            }
          />
        )}
        <DualListSelectorList>
          {visibleChosen.map((scope) => (
            <DualListSelectorListItem
              key={scope}
              isSelected={chosenSelected.has(scope)}
              onOptionSelect={() =>
                toggleSet(chosenSelected, setChosenSelected, scope)
              }
            >
              {scope}
            </DualListSelectorListItem>
          ))}
        </DualListSelectorList>
      </DualListSelectorPane>
    </DualListSelector>
  );
};
