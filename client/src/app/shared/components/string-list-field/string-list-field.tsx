import * as React from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import {
  InputGroup,
  TextInput,
  Button,
  InputGroupText,
} from "@patternfly/react-core";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";
import DelIcon from "@patternfly/react-icons/dist/esm/icons/error-circle-o-icon";
import { getValidatedFromErrorTouched } from "@app/utils/utils";
import { HookFormPFGroupController } from "../hook-form-pf-fields";

import "./string-list-field.css";

export interface StringListFieldProps {
  listItems: string[];
  setListItems: (items: string[]) => void;
  itemToAddSchema: yup.StringSchema;
  itemToAddFieldId: string;
  itemToAddLabel?: React.ReactNode;
  itemToAddAriaLabel: string;
  itemNotUniqueMessage: string;
  removeItemButtonId: (item: string) => string;
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
          fieldState: { isTouched, error },
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
                validated={getValidatedFromErrorTouched(error, isTouched)}
                value={value}
                onChange={onChange}
                onBlur={onBlur}
                onKeyUp={(event) => {
                  if (event.key === "Enter") {
                    onBlur();
                    if (isValid) addItem();
                  }
                }}
              />
              <Button
                id="add-package-to-include"
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
        <div className={`${spacing.mtMd} ${spacing.mlLg}`}>
          {listItems.map((item) =>
            item ? (
              <InputGroup key={item}>
                <InputGroupText className="string-list-field-item">
                  {item}
                </InputGroupText>
                <Button
                  isInline
                  id={removeItemButtonId(item)}
                  variant="control"
                  icon={<DelIcon />}
                  onClick={() => {
                    setListItems(listItems.filter((i) => i !== item));
                  }}
                />
              </InputGroup>
            ) : null
          )}
        </div>
      )}
    </div>
  );
};
