import { useRef, useState } from "react";
import * as React from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Button, FormFieldGroupHeader, Label } from "@patternfly/react-core";
import { PlusCircleIcon } from "@patternfly/react-icons";

import { ControlledFormFieldGroupExpandable } from "@app/components/ControlledFormFieldGroupExpandable";

import { ParameterFields } from "./generator-parameter-fields";

const GeneratorFormParametersComponent: React.FC = () => {
  const { t } = useTranslation();
  const { control } = useFormContext();
  const params = useWatch({
    control,
    name: "params",
  });
  const count = params?.length ?? 0;
  const addButtonRef = useRef<{ addField: () => void }>(null);
  const [isExpanded, setIsExpanded] = useState(count > 0);

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
      toggleAriaLabel={t("actions.toggleParametersSection")}
      header={
        <FormFieldGroupHeader
          titleText={{
            text: (
              <>
                {t("terms.parameters")} <Label color="blue">{count}</Label>
              </>
            ),
            id: "parameters-header",
          }}
          actions={
            <Button
              icon={<PlusCircleIcon />}
              id="add-generator-parameter"
              variant="link"
              onClick={handleAddClick}
            >
              {t("composed.addNew", {
                what: t("terms.parameter").toLowerCase(),
              })}
            </Button>
          }
        />
      }
    >
      <ParameterFields
        ref={addButtonRef}
        noParametersMessage={t("message.noParametersToDisplay")}
        removeLabel={t("actions.removeParameter")}
        name="params"
      />
    </ControlledFormFieldGroupExpandable>
  );
};

export const GeneratorFormParameters = React.memo(
  GeneratorFormParametersComponent
);
