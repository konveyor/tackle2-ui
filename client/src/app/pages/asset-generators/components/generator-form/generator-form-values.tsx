import React, { useRef, useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Button, FormFieldGroupHeader, Label } from "@patternfly/react-core";
import { PlusCircleIcon } from "@patternfly/react-icons/dist/js/icons/plus-circle-icon";

import { ControlledFormFieldGroupExpandable } from "@app/components/ControlledFormFieldGroupExpandable";

import { KeyValueFields } from "./generator-fields-mapper";

interface GeneratorFormValuesProps {}

const GeneratorFormValuesComponent: React.FC<GeneratorFormValuesProps> = () => {
  const { t } = useTranslation();
  const { control } = useFormContext();
  const values = useWatch({
    control,
    name: "values",
  });
  const addButtonRef = useRef<{ addField: () => void }>(null);
  const [isExpanded, setIsExpanded] = useState(values.length > 0);

  const handleAddClick = () => {
    if (!addButtonRef.current) {
      setIsExpanded(true);
      // wait for the next tick to ensure the component is mounted
      Promise.resolve().then(() => {
        addButtonRef.current?.addField();
      });
    } else {
      addButtonRef.current?.addField();
    }
  };

  return (
    <ControlledFormFieldGroupExpandable
      isExpanded={isExpanded}
      onToggle={() => setIsExpanded(!isExpanded)}
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
    </ControlledFormFieldGroupExpandable>
  );
};

export const GeneratorFormValues = React.memo(GeneratorFormValuesComponent);
