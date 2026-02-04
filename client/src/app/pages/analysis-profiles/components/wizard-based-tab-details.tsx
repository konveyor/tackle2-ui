import * as React from "react";
import { Bullseye, Spinner } from "@patternfly/react-core";

import { AnalysisProfile } from "@app/api/models";

import {
  InitialStateRecipe,
  useWizardReducer,
} from "../profile-wizard/useWizardReducer";
import { useWizardStateBuilder } from "../profile-wizard/useWizardStateBuilder";

import { DetailsContent } from "./details-content";

export const WizardBasedTabDetails: React.FC<{
  analysisProfile: AnalysisProfile;
}> = ({ analysisProfile }) => {
  const { recipe: initialState, isLoading } =
    useWizardStateBuilder(analysisProfile);

  if (isLoading) {
    return (
      <Bullseye>
        <Spinner size="xl" />
      </Bullseye>
    );
  }
  return (
    <DetailsContentWrapper
      initialState={initialState}
      key={`details-content-${analysisProfile.id}-${analysisProfile.name}`}
    />
  );
};

const DetailsContentWrapper: React.FC<{ initialState: InitialStateRecipe }> = ({
  initialState,
}) => {
  const { state } = useWizardReducer(initialState);
  return <DetailsContent state={state} hideName />;
};
