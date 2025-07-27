import React, { useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  Button,
  FormFieldGroupExpandable,
  FormFieldGroupHeader,
  Label,
} from "@patternfly/react-core";
import { PlusCircleIcon } from "@patternfly/react-icons/dist/js/icons/plus-circle-icon";
import { KeyValueFields } from "./generator-fields-mapper";
import { useFieldArray, useFormContext } from "react-hook-form";

interface GeneratorFormParametersProps {}

const GeneratorFormParametersComponent: React.FC<
  GeneratorFormParametersProps
> = () => {
  const { t } = useTranslation();
  const addButtonRef = useRef<{ addField: () => void }>(null);

  const handleAddClick = () => {
    append({ key: "", value: "" });
    // addButtonRef.current?.addField();
  };

  const { control } = useFormContext();
  const { fields, append } = useFieldArray({
    control,
    name: "parameters",
  });

  return (
    <FormFieldGroupExpandable
      isExpanded={fields.length > 0}
      toggleAriaLabel="Toggle parameters section"
      header={
        <FormFieldGroupHeader
          titleText={{
            text: (
              <>
                {t("terms.parameters")}{" "}
                <Label color="blue">{fields.length}</Label>
              </>
            ),
            id: "parameters-header",
          }}
          actions={
            <Button
              icon={<PlusCircleIcon />}
              id="add-generator-value"
              variant="link"
              onClick={handleAddClick}
            >
              Add new parameter definition
            </Button>
          }
        />
      }
    >
      <KeyValueFields
        ref={addButtonRef}
        noValuesMessage="No parameters to display"
        removeLabel="Remove this parameter definition"
        name="parameters"
      />
    </FormFieldGroupExpandable>
  );
};

export const GeneratorFormParameters = React.memo(
  GeneratorFormParametersComponent
);
