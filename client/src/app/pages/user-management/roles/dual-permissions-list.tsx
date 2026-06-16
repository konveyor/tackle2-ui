import { FC, useMemo, useState } from "react";
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
  SearchIcon,
} from "@patternfly/react-icons";

import { Ref } from "@app/api/models";
import { SimpleEmptyState } from "@app/components/SimpleEmptyState";
import { Permission } from "@app/pages/user-management/types";
import { toRef } from "@app/utils/model-utils";

const toggleSet = (
  set: Set<number>,
  setState: React.Dispatch<React.SetStateAction<Set<number>>>,
  id: number
) => {
  const next = new Set(set);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  setState(next);
};

export interface DualPermissionsListProps {
  chosenRefs: Ref[];
  onChange: (chosenRefs: Ref[]) => void;
  allPermissions: Permission[];
}

export const DualPermissionsList: FC<DualPermissionsListProps> = ({
  chosenRefs,
  onChange,
  allPermissions,
}) => {
  const { t } = useTranslation();
  const permissionById = useMemo(
    () => Object.fromEntries(allPermissions.map((p) => [String(p.id), p])),
    [allPermissions]
  );

  const [availableFilter, setAvailableFilter] = useState("");
  const [chosenFilter, setChosenFilter] = useState("");
  const [availableSelected, setAvailableSelected] = useState<Set<number>>(
    new Set()
  );
  const [chosenSelected, setChosenSelected] = useState<Set<number>>(new Set());

  const displayLabel = (p: Permission) => p.scope ?? String(p.id);

  const matchesFilter = (p: Permission, filter: string) =>
    !filter || displayLabel(p).toLowerCase().includes(filter.toLowerCase());
  const chosenIds = new Set(chosenRefs.map((p) => p.id));
  const chosenPermissions = chosenRefs
    .map((p) => permissionById[String(p.id)])
    .filter(Boolean);
  const availablePermissions = allPermissions.filter(
    (p) => !chosenIds.has(p.id)
  );

  // show already selected to avoid silent modifications
  const visibleAvailable = availablePermissions.filter(
    (p) => matchesFilter(p, availableFilter) || availableSelected.has(p.id)
  );
  const visibleChosen = chosenPermissions.filter(
    (p) => matchesFilter(p, chosenFilter) || chosenSelected.has(p.id)
  );

  const moveToChosen = (items: Permission[]) => {
    onChange([...chosenPermissions, ...items].map(toRef).filter(Boolean));
    setAvailableSelected(new Set());
  };
  const moveToAvailable = (items: Permission[]) => {
    const removeIds = new Set(items.map((p) => p.id));
    onChange(
      chosenPermissions
        .filter((p) => !removeIds.has(p.id))
        .map(toRef)
        .filter(Boolean)
    );
    setChosenSelected(new Set());
  };
  const moveAllVisibleToChosen = () => {
    onChange(
      [...chosenPermissions, ...visibleAvailable].map(toRef).filter(Boolean)
    );
    setAvailableSelected(new Set());
  };
  const moveAllVisibleToAvailable = () => {
    const removeIds = new Set(visibleChosen.map((p) => p.id));
    onChange(
      chosenPermissions
        .filter((p) => !removeIds.has(p.id))
        .map(toRef)
        .filter(Boolean)
    );
    setChosenSelected(new Set());
  };
  const numAvailSel = visibleAvailable.filter((p) =>
    availableSelected.has(p.id)
  ).length;
  const numChosenSel = visibleChosen.filter((p) =>
    chosenSelected.has(p.id)
  ).length;

  return (
    <DualListSelector>
      <DualListSelectorPane
        title={t("terms.availablePermissions")}
        status={`${numAvailSel} of ${visibleAvailable.length} options selected`}
        searchInput={
          <SearchInput
            value={availableFilter}
            onChange={(_event, value) => setAvailableFilter(value)}
            onClear={() => setAvailableFilter("")}
            aria-label="Search available permissions"
          />
        }
        listMinHeight="300px"
      >
        {availableFilter && visibleAvailable.length === 0 && (
          <SimpleEmptyState
            icon={SearchIcon}
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
          {visibleAvailable.map((p) => (
            <DualListSelectorListItem
              key={p.id}
              isSelected={availableSelected.has(p.id)}
              onOptionSelect={() =>
                toggleSet(availableSelected, setAvailableSelected, p.id)
              }
            >
              {displayLabel(p)}
            </DualListSelectorListItem>
          ))}
        </DualListSelectorList>
      </DualListSelectorPane>

      <DualListSelectorControlsWrapper>
        <DualListSelectorControl
          isDisabled={numAvailSel === 0}
          onClick={() =>
            moveToChosen(
              visibleAvailable.filter((p) => availableSelected.has(p.id))
            )
          }
          aria-label="Add selected"
          tooltipContent="Add selected"
        >
          <AngleRightIcon />
        </DualListSelectorControl>
        <DualListSelectorControl
          isDisabled={visibleAvailable.length === 0}
          onClick={moveAllVisibleToChosen}
          aria-label="Add all"
          tooltipContent="Add all"
        >
          <AngleDoubleRightIcon />
        </DualListSelectorControl>
        <DualListSelectorControl
          isDisabled={numChosenSel === 0}
          onClick={() =>
            moveToAvailable(
              visibleChosen.filter((p) => chosenSelected.has(p.id))
            )
          }
          aria-label="Remove selected"
          tooltipContent="Remove selected"
        >
          <AngleLeftIcon />
        </DualListSelectorControl>
        <DualListSelectorControl
          isDisabled={visibleChosen.length === 0}
          onClick={moveAllVisibleToAvailable}
          aria-label="Remove all"
          tooltipContent="Remove all"
        >
          <AngleDoubleLeftIcon />
        </DualListSelectorControl>
      </DualListSelectorControlsWrapper>

      <DualListSelectorPane
        title={t("terms.chosenPermissions")}
        status={`${numChosenSel} of ${visibleChosen.length} options selected`}
        searchInput={
          <SearchInput
            value={chosenFilter}
            onChange={(_event, value) => setChosenFilter(value)}
            onClear={() => setChosenFilter("")}
            aria-label="Search chosen permissions"
          />
        }
        listMinHeight="300px"
        isChosen
      >
        {chosenFilter && visibleChosen.length === 0 && (
          <SimpleEmptyState
            title={t("message.noResultsFoundTitle")}
            icon={SearchIcon}
            description={t("message.noResultsFoundBody")}
            primaryAction={
              <Button variant="link" onClick={() => setChosenFilter("")}>
                {t("actions.clearAllFilters")}
              </Button>
            }
          />
        )}
        <DualListSelectorList>
          {visibleChosen.map((p) => (
            <DualListSelectorListItem
              key={p.id}
              isSelected={chosenSelected.has(p.id)}
              onOptionSelect={() =>
                toggleSet(chosenSelected, setChosenSelected, p.id)
              }
            >
              {displayLabel(p)}
            </DualListSelectorListItem>
          ))}
        </DualListSelectorList>
      </DualListSelectorPane>
    </DualListSelector>
  );
};
