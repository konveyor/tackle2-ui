import React from "react";
import { useTranslation } from "react-i18next";
import { ExpandableSection } from "@patternfly/react-core";
import { KeyValueFields } from "../fields-mapper/generator-fields-mapper";

interface GeneratorFormParametersProps {
  collection: Record<string, any>;
}

const GeneratorFormParametersComponent: React.FC<
  GeneratorFormParametersProps
> = ({ collection }) => {
  const { t } = useTranslation();
  const [isParametersExpanded, setParametersExpanded] = React.useState(false);

  return (
    <ExpandableSection
      toggleText={t("terms.parameters")}
      className="toggle"
      onToggle={() => setParametersExpanded(!isParametersExpanded)}
      isExpanded={isParametersExpanded}
    >
      <div className="pf-v5-c-form">
        <KeyValueFields collection={collection} name="parameters" />
      </div>
    </ExpandableSection>
  );
};

export const GeneratorFormParameters = React.memo(
  GeneratorFormParametersComponent
);
