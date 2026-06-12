import { FC, useMemo, useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { useTranslation } from "react-i18next";
import {
  DualListSelector,
  DualListSelectorControl,
  DualListSelectorControlsWrapper,
  DualListSelectorList,
  DualListSelectorListItem,
  DualListSelectorPane,
  Form,
} from "@patternfly/react-core";
import {
  AngleDoubleLeftIcon,
  AngleDoubleRightIcon,
  AngleLeftIcon,
  AngleRightIcon,
} from "@patternfly/react-icons";

import {
  HookFormPFGroupController,
  HookFormPFTextInput,
} from "@app/components/HookFormPFFields";
import { toRef } from "@app/utils/model-utils";

import { useFetchPermissions } from "../permissions/use-permissions";
import { Permission, Role } from "../types";

export type RoleFormValues = Pick<Role, "name" | "permissions">;

export const ROLE_DEFAULTS: RoleFormValues = { name: "", permissions: [] };

export interface RoleFormProps {
  form: UseFormReturn<RoleFormValues>;
}

export const RoleForm: FC<RoleFormProps> = ({ form }) => {
  const { t } = useTranslation();
  const { control } = form;
  const { permissions: allPermissions } = useFetchPermissions();

  const scopeById = useMemo(
    () => Object.fromEntries(allPermissions.map((p) => [String(p.id), p])),
    [allPermissions]
  );

  const [availableSelected, setAvailableSelected] = useState<Permission[]>([]);
  const [chosenSelected, setChosenSelected] = useState<Permission[]>([]);

  const displayLabel = (p: Permission) => p.scope ?? String(p.id);

  return (
    <Form>
      <HookFormPFTextInput
        control={control}
        name="name"
        label={t("terms.name")}
        fieldId="name"
        isRequired
      />
      <HookFormPFGroupController
        control={control}
        name="permissions"
        label={t("terms.permissions")}
        fieldId="permissions"
        renderInput={({ field: { value: chosenRefs, onChange } }) => {
          const chosenIds = new Set(chosenRefs.map((p) => p.id));
          const chosen = chosenRefs
            .map((p) => scopeById[String(p.id)])
            .filter(Boolean);

          const available: Permission[] = allPermissions.filter(
            (p) => !chosenIds.has(p.id)
          );

          const moveToChosen = (items: Permission[]) => {
            onChange([...chosen, ...items].map(toRef));
            setAvailableSelected([]);
          };
          const moveToAvailable = (items: Permission[]) => {
            const removeIds = new Set(items.map((p) => p.id));
            onChange(chosen.filter((p) => !removeIds.has(p.id)).map(toRef));
            setChosenSelected([]);
          };
          const moveAllToChosen = () => {
            onChange([...chosen, ...available].map(toRef));
            setAvailableSelected([]);
          };
          const moveAllToAvailable = () => {
            onChange([]);
            setChosenSelected([]);
          };

          const toggleAvailable = (p: Permission) =>
            setAvailableSelected((prev) =>
              prev.find((s) => s.id === p.id)
                ? prev.filter((s) => s.id !== p.id)
                : [...prev, p]
            );
          const toggleChosen = (p: Permission) =>
            setChosenSelected((prev) =>
              prev.find((s) => s.id === p.id)
                ? prev.filter((s) => s.id !== p.id)
                : [...prev, p]
            );

          return (
            <DualListSelector>
              <DualListSelectorPane
                title={t("terms.availablePermissions")}
                status={`${availableSelected.length} of ${available.length} options selected`}
              >
                <DualListSelectorList>
                  {available.map((p) => (
                    <DualListSelectorListItem
                      key={p.id}
                      isSelected={
                        !!availableSelected.find((s) => s.id === p.id)
                      }
                      onOptionSelect={() => toggleAvailable(p)}
                    >
                      {p.scope}
                    </DualListSelectorListItem>
                  ))}
                </DualListSelectorList>
              </DualListSelectorPane>

              <DualListSelectorControlsWrapper>
                <DualListSelectorControl
                  isDisabled={availableSelected.length === 0}
                  onClick={() => moveToChosen(availableSelected)}
                  aria-label="Add selected"
                  tooltipContent="Add selected"
                >
                  <AngleRightIcon />
                </DualListSelectorControl>
                <DualListSelectorControl
                  isDisabled={available.length === 0}
                  onClick={moveAllToChosen}
                  aria-label="Add all"
                  tooltipContent="Add all"
                >
                  <AngleDoubleRightIcon />
                </DualListSelectorControl>
                <DualListSelectorControl
                  isDisabled={chosenSelected.length === 0}
                  onClick={() => moveToAvailable(chosenSelected)}
                  aria-label="Remove selected"
                  tooltipContent="Remove selected"
                >
                  <AngleLeftIcon />
                </DualListSelectorControl>
                <DualListSelectorControl
                  isDisabled={chosen.length === 0}
                  onClick={moveAllToAvailable}
                  aria-label="Remove all"
                  tooltipContent="Remove all"
                >
                  <AngleDoubleLeftIcon />
                </DualListSelectorControl>
              </DualListSelectorControlsWrapper>

              <DualListSelectorPane
                title={t("terms.chosenPermissions")}
                status={`${chosenSelected.length} of ${chosen.length} options selected`}
                isChosen
              >
                <DualListSelectorList>
                  {chosen.map((p) => (
                    <DualListSelectorListItem
                      key={p.id}
                      isSelected={!!chosenSelected.find((s) => s.id === p.id)}
                      onOptionSelect={() => toggleChosen(p)}
                    >
                      {displayLabel(p)}
                    </DualListSelectorListItem>
                  ))}
                </DualListSelectorList>
              </DualListSelectorPane>
            </DualListSelector>
          );
        }}
      />
    </Form>
  );
};
