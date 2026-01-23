import * as React from "react";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import * as yup from "yup";
import { Button, InputGroup, TextInput } from "@patternfly/react-core";
import TimesCircleIcon from "@patternfly/react-icons/dist/esm/icons/times-circle-icon";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";
import { Table, Tbody, Td, Tr } from "@patternfly/react-table";

import { getValidatedFromErrors } from "@app/utils/utils";

import { HookFormPFGroupController } from "./HookFormPFFields";

export interface StringListFieldProps {
  listItems: string[];
  setListItems: (items: string[]) => void;
  itemToAddSchema: yup.StringSchema;
  itemToAddFieldId: string;
  itemToAddLabel?: React.ReactNode;
  itemToAddAriaLabel: string;
  itemNotUniqueMessage: string;
  removeItemButtonId: (item: string) => string;
  addButtonId?: string;
  className?: string;
}

export const StringListField: React.FC<StringListFieldProps> = ({
  listItems,
  setListItems,
  itemToAddSchema,
  itemToAddFieldId,
  itemToAddLabel,
  itemToAddAriaLabel,
  itemNotUniqueMessage,
  removeItemButtonId,
  addButtonId = "add-package-to-include",
  className = "",
}) => {
  const { t } = useTranslation();

  const addItemForm = useForm({
    defaultValues: { itemToAdd: "" },
    resolver: yupResolver(
      yup.object().shape(
        {
          itemToAdd: yup.string().when("itemToAdd", (itemToAdd, schema) =>
            itemToAdd === "" // Forcibly allow empty string even if itemToAddSchema doesn't
              ? schema
              : itemToAddSchema.notOneOf(listItems, itemNotUniqueMessage)
          ),
        },
        [["itemToAdd", "itemToAdd"]] // Use noSortEdges param to allow the circular dependency in .when() above
      )
    ),
    mode: "onChange",
  });

  return (
    <div className={className}>
      <HookFormPFGroupController
        control={addItemForm.control}
        name="itemToAdd"
        fieldId={itemToAddFieldId}
        label={itemToAddLabel}
        renderInput={({
          field: { onChange, onBlur, value, ref },
          fieldState: { isDirty, error, isTouched },
        }) => {
          const isValid = !!value && !error;
          const addItem = () => {
            setListItems([...listItems, value]);
            addItemForm.resetField("itemToAdd");
          };
          return (
            <InputGroup>
              <TextInput
                ref={ref}
                id={itemToAddFieldId}
                aria-label={itemToAddAriaLabel}
                validated={getValidatedFromErrors(error, isDirty, isTouched)}
                value={value}
                onChange={(_, value) => onChange(value)}
                onBlur={onBlur}
                onKeyUp={(event) => {
                  if (event.key === "Enter") {
                    onBlur();
                    if (isValid) addItem();
                  }
                }}
              />
              <Button
                id={addButtonId}
                variant="control"
                isDisabled={!isValid}
                onClick={addItem}
              >
                {t("terms.add")}
              </Button>
            </InputGroup>
          );
        }}
      />
      {listItems.length > 0 && (
        <div className={spacing.mtMd}>
          <Table variant="compact">
            <Tbody>
              {listItems.map((item) =>
                item ? (
                  <Tr key={item}>
                    <Td>{item}</Td>
                    <Td modifier="fitContent">
                      <Button
                        isInline
                        variant="plain"
                        id={removeItemButtonId(item)}
                        icon={<TimesCircleIcon />}
                        onClick={() => {
                          setListItems(listItems.filter((i) => i !== item));
                        }}
                        className={spacing.py_0}
                      />
                    </Td>
                  </Tr>
                ) : null
              )}
            </Tbody>
          </Table>
        </div>
      )}
    </div>
  );
};
