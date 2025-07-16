import React from "react";
import { useTranslation } from "react-i18next";
import { ExpandableSection } from "@patternfly/react-core";
import { KeyValueFields } from "../fields-mapper/generator-fields-mapper";

interface GeneratorFormValuesProps {
  collection: Record<string, any>;
}

const GeneratorFormValuesComponent: React.FC<GeneratorFormValuesProps> = ({
  collection,
}) => {
  const { t } = useTranslation();
  const [isValuesExpanded, setValuesExpanded] = React.useState(false);

  return (
    <ExpandableSection
      toggleText={t("terms.values")}
      className="toggle"
      onToggle={() => setValuesExpanded(!isValuesExpanded)}
      isExpanded={isValuesExpanded}
    >
      <div className="pf-v5-c-form">
        <KeyValueFields collection={collection} name="values" />
      </div>
    </ExpandableSection>
  );
};

export const GeneratorFormValues = React.memo(GeneratorFormValuesComponent);
