import React, { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, FormFieldGroupHeader, Label } from "@patternfly/react-core";
import { PlusCircleIcon } from "@patternfly/react-icons/dist/js/icons/plus-circle-icon";
import { ControlledFormFieldGroupExpandable } from "@app/components/ControlledFormFieldGroupExpandable";
import { KeyValueFields } from "./generator-fields-mapper";
import { useFormContext, useWatch } from "react-hook-form";

interface GeneratorFormParametersProps {}

const GeneratorFormParametersComponent: React.FC<
  GeneratorFormParametersProps
> = () => {
  const { t } = useTranslation();
  const { control } = useFormContext();
  const parameters = useWatch({
    control,
    name: "parameters",
  });
  const addButtonRef = useRef<{ addField: () => void }>(null);
  const [isExpanded, setIsExpanded] = useState(parameters.length > 0);

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
      toggleAriaLabel="Toggle parameters section"
      header={
        <FormFieldGroupHeader
          titleText={{
            text: (
              <>
                {t("terms.parameters")}{" "}
                <Label color="blue">{parameters.length}</Label>
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
    </ControlledFormFieldGroupExpandable>
  );
};

export const GeneratorFormParameters = React.memo(
  GeneratorFormParametersComponent
);
