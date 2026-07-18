import { FC, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Button,
  DualListSelector as PFDualListSelector,
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

export interface DualListSelectorProps {
  chosenOptions: string[];
  onChange: (chosenOptions: string[]) => void;
  allOptions: string[];
  allOptionsTitle: string;
  chosenOptionsTitle: string;
}

export const DualListSelector: FC<DualListSelectorProps> = ({
  chosenOptions,
  onChange,
  allOptions,
  allOptionsTitle,
  chosenOptionsTitle,
}) => {
  const { t } = useTranslation();

  const [availableFilter, setAvailableFilter] = useState("");
  const [chosenFilter, setChosenFilter] = useState("");
  const [availableSelected, setAvailableSelected] = useState<Set<string>>(
    new Set()
  );
  const [chosenSelected, setChosenSelected] = useState<Set<string>>(new Set());

  const matchesFilter = (option: string, filter: string) =>
    !filter || option.toLowerCase().includes(filter.toLowerCase());

  const availableOptions = allOptions.filter(
    (option) => !chosenOptions.includes(option)
  );

  // show already selected to avoid silent modifications
  const visibleAvailable = availableOptions.filter(
    (option) =>
      matchesFilter(option, availableFilter) || availableSelected.has(option)
  );
  const visibleChosen = chosenOptions.filter(
    (option) =>
      matchesFilter(option, chosenFilter) || chosenSelected.has(option)
  );

  const moveToChosen = (items: string[]) => {
    onChange([...chosenOptions, ...items]);
    setAvailableSelected(new Set());
  };
  const moveToAvailable = (items: string[]) => {
    const removeOptions = new Set(items);
    onChange(chosenOptions.filter((option) => !removeOptions.has(option)));
    setChosenSelected(new Set());
  };
  const moveAllVisibleToChosen = () => {
    onChange([...chosenOptions, ...visibleAvailable]);
    setAvailableSelected(new Set());
  };
  const moveAllVisibleToAvailable = () => {
    const removeOptions = new Set(visibleChosen);
    onChange(chosenOptions.filter((option) => !removeOptions.has(option)));
    setChosenSelected(new Set());
  };
  const numAvailSel = visibleAvailable.filter((option) =>
    availableSelected.has(option)
  ).length;
  const numChosenSel = visibleChosen.filter((option) =>
    chosenSelected.has(option)
  ).length;

  return (
    <PFDualListSelector>
      <DualListSelectorPane
        title={allOptionsTitle}
        status={t("message.selectedOptions", {
          count: numAvailSel,
          total: visibleAvailable.length,
        })}
        searchInput={
          <SearchInput
            value={availableFilter}
            onChange={(_event, value) => setAvailableFilter(value)}
            onClear={() => setAvailableFilter("")}
            aria-label={t("message.searchAvailableOptions")}
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
          {visibleAvailable.map((option) => (
            <DualListSelectorListItem
              key={option}
              isSelected={availableSelected.has(option)}
              onOptionSelect={() =>
                toggleSet(availableSelected, setAvailableSelected, option)
              }
            >
              {option}
            </DualListSelectorListItem>
          ))}
        </DualListSelectorList>
      </DualListSelectorPane>

      <DualListSelectorControlsWrapper>
        <DualListSelectorControl
          isDisabled={numAvailSel === 0}
          onClick={() =>
            moveToChosen(
              visibleAvailable.filter((option) => availableSelected.has(option))
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
              visibleChosen.filter((option) => chosenSelected.has(option))
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
        title={chosenOptionsTitle}
        status={t("message.selectedOptions", {
          count: numChosenSel,
          total: visibleChosen.length,
        })}
        searchInput={
          <SearchInput
            value={chosenFilter}
            onChange={(_event, value) => setChosenFilter(value)}
            onClear={() => setChosenFilter("")}
            aria-label={t("message.searchChosenOptions")}
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
          {visibleChosen.map((option) => (
            <DualListSelectorListItem
              key={option}
              isSelected={chosenSelected.has(option)}
              onOptionSelect={() =>
                toggleSet(chosenSelected, setChosenSelected, option)
              }
            >
              {option}
            </DualListSelectorListItem>
          ))}
        </DualListSelectorList>
      </DualListSelectorPane>
    </PFDualListSelector>
  );
};
