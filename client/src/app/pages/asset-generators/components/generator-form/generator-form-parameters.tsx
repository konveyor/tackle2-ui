import React from "react";
import { useTranslation } from "react-i18next";
import { ExpandableSection } from "@patternfly/react-core";
import { KeyValueFields } from "./generator-fields-mapper";

interface GeneratorFormParametersProps {}

const GeneratorFormParametersComponent: React.FC<
  GeneratorFormParametersProps
> = () => {
  const { t } = useTranslation();
  const [isParametersExpanded, setParametersExpanded] = React.useState(false);

  return (
    <ExpandableSection // TODO: Convert to FormFieldGroupExpandable
      toggleText={t("terms.parameters")}
      className="toggle"
      onToggle={() => setParametersExpanded(!isParametersExpanded)}
      isExpanded={isParametersExpanded}
    >
      <div className="pf-v5-c-form">
        <KeyValueFields
          addLabel="Add parameter definition"
          removeLabel="Remove this parameter definition"
          name="parameters"
        />
      </div>
    </ExpandableSection>
  );
};

export const GeneratorFormParameters = React.memo(
  GeneratorFormParametersComponent
);
