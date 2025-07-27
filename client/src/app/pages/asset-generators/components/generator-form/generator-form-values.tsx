import React from "react";
import { useTranslation } from "react-i18next";
import { ExpandableSection } from "@patternfly/react-core";
import { KeyValueFields } from "./generator-fields-mapper";

interface GeneratorFormValuesProps {}

const GeneratorFormValuesComponent: React.FC<GeneratorFormValuesProps> = () => {
  const { t } = useTranslation();
  const [isValuesExpanded, setValuesExpanded] = React.useState(false);

  return (
    <ExpandableSection // TODO: Convert to FormFieldGroupExpandable
      toggleText={t("terms.values")}
      className="toggle"
      onToggle={() => setValuesExpanded(!isValuesExpanded)}
      isExpanded={isValuesExpanded}
    >
      <div className="pf-v5-c-form">
        <KeyValueFields
          addLabel="Add new key/value pair"
          removeLabel="Remove this key/value pair"
          name="values"
        />
      </div>
    </ExpandableSection>
  );
};

export const GeneratorFormValues = React.memo(GeneratorFormValuesComponent);
