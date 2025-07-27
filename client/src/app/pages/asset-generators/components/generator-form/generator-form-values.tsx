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
import { useFormContext, useWatch } from "react-hook-form";

interface GeneratorFormValuesProps {}

const GeneratorFormValuesComponent: React.FC<GeneratorFormValuesProps> = () => {
  const { t } = useTranslation();
  const addButtonRef = useRef<{ addField: () => void }>(null);

  const handleAddClick = () => {
    addButtonRef.current?.addField();
  };

  const { control } = useFormContext();
  const values = useWatch({
    control,
    name: "values",
  });

  return (
    <FormFieldGroupExpandable
      isExpanded={values.length > 0}
      toggleAriaLabel="Toggle values section"
      header={
        <FormFieldGroupHeader
          titleText={{
            text: (
              <>
                {t("terms.values")} <Label color="blue">{values.length}</Label>
              </>
            ),
            id: "values-header",
          }}
          actions={
            <Button
              icon={<PlusCircleIcon />}
              id="add-generator-value"
              variant="link"
              onClick={handleAddClick}
            >
              Add new key/value pair
            </Button>
          }
        />
      }
    >
      <KeyValueFields
        ref={addButtonRef}
        noValuesMessage="No values to display"
        removeLabel="Remove this key/value pair"
        name="values"
      />
    </FormFieldGroupExpandable>
  );
};

export const GeneratorFormValues = React.memo(GeneratorFormValuesComponent);
