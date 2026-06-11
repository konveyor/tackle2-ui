import { FC, useState } from "react";
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
import AngleDoubleLeftIcon from "@patternfly/react-icons/dist/esm/icons/angle-double-left-icon";
import AngleDoubleRightIcon from "@patternfly/react-icons/dist/esm/icons/angle-double-right-icon";
import AngleLeftIcon from "@patternfly/react-icons/dist/esm/icons/angle-left-icon";
import AngleRightIcon from "@patternfly/react-icons/dist/esm/icons/angle-right-icon";

import {
  HookFormPFGroupController,
  HookFormPFTextInput,
} from "@app/components/HookFormPFFields";
import { Ref } from "@app/api/models";

import { useFetchPermissions } from "../permissions/use-permissions";
import { Role } from "../types";

export type RoleFormValues = Pick<Role, "name" | "permissions">;

export const ROLE_DEFAULTS: RoleFormValues = { name: "", permissions: [] };

export interface RoleFormProps {
  form: UseFormReturn<RoleFormValues>;
}

export const RoleForm: FC<RoleFormProps> = ({ form }) => {
  const { t } = useTranslation();
  const { control } = form;
  const { permissions: allPermissions } = useFetchPermissions();

  const [availableSelected, setAvailableSelected] = useState<Ref[]>([]);
  const [chosenSelected, setChosenSelected] = useState<Ref[]>([]);

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
        renderInput={({ field: { value: chosen, onChange } }) => {
          const chosenIds = new Set(chosen.map((p) => p.id));
          // Convert available permissions to Ref objects
          const available: Ref[] = allPermissions
            .filter((p) => !chosenIds.has(p.id))
            .map(({ id, name }) => ({ id, name }));

          const moveToChosen = (items: Ref[]) => {
            onChange([...chosen, ...items]);
            setAvailableSelected([]);
          };
          const moveToAvailable = (items: Ref[]) => {
            const removeIds = new Set(items.map((p) => p.id));
            onChange(chosen.filter((p) => !removeIds.has(p.id)));
            setChosenSelected([]);
          };
          const moveAllToChosen = () => {
            onChange([...chosen, ...available]);
            setAvailableSelected([]);
          };
          const moveAllToAvailable = () => {
            onChange([]);
            setChosenSelected([]);
          };

          const toggleAvailable = (p: Ref) =>
            setAvailableSelected((prev) =>
              prev.find((s) => s.id === p.id)
                ? prev.filter((s) => s.id !== p.id)
                : [...prev, p]
            );
          const toggleChosen = (p: Ref) =>
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
                      {p.name}
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
                      {p.name}
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
