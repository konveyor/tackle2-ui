import * as React from "react";
import { Bullseye, Spinner } from "@patternfly/react-core";

import { AnalysisProfile } from "@app/api/models";

import { useWizardReducer } from "../profile-wizard/useWizardReducer";
import { useWizardStateBuilder } from "../profile-wizard/useWizardStateBuilder";

import { DetailsContent } from "./details-content";

export const WizardBasedTabDetails: React.FC<{
  analysisProfile: AnalysisProfile;
}> = ({ analysisProfile }) => {
  const { recipe: initialState, isLoading } =
    useWizardStateBuilder(analysisProfile);
  const { state } = useWizardReducer(initialState);
  if (isLoading) {
    return (
      <Bullseye>
        <Spinner size="xl" />
      </Bullseye>
    );
  }
  return <DetailsContent state={state} />;
};
