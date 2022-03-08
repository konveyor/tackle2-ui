import * as React from "react";
import { Text, TextContent, Title } from "@patternfly/react-core";

import { AddCustomRules } from "./components/add-custom-rules";

interface ICustomRules {}

export const CustomRules: React.FunctionComponent<ICustomRules> = ({}) => {
  const [isAddCustomRulesModalOpen, setCustomRulesModalOpen] =
    React.useState(false);

  return (
    <>
      <TextContent>
        <Title headingLevel="h3" size="xl">
          Custom rules
        </Title>
        <Text>Upload the rules you want to include in the analysis.</Text>
      </TextContent>
      {isAddCustomRulesModalOpen && (
        <AddCustomRules onClose={() => setCustomRulesModalOpen(false)} />
      )}
    </>
  );
};
