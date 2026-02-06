import * as React from "react";
import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Form,
  FormGroup,
  Radio,
  Text,
  TextContent,
  Title,
} from "@patternfly/react-core";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";

import { AnalysisProfile, Application } from "@app/api/models";
import { NoDataEmptyState } from "@app/components/NoDataEmptyState";
import { SimpleSelectBasic } from "@app/components/SimpleSelectBasic";
import { isModeSupported } from "@app/components/analysis/steps/analysis-source";
import { useAvailableAnalysisProfiles } from "@app/hooks/useAvailableAnalysisProfiles";
import { useFetchAnalysisProfiles } from "@app/queries/analysis-profiles";
import { useFetchArchetypes } from "@app/queries/archetypes";

// Wizard flow mode - Manual vs Analysis Profile
export type WizardFlowMode = "manual" | "profile";

export interface WizardFlowModeValues {
  flowMode: WizardFlowMode;
  selectedProfile: AnalysisProfile | null;
}

export interface WizardFlowModeState extends WizardFlowModeValues {
  isValid: boolean;
}

interface WizardModeProps {
  applications: Application[];
  onStateChanged: (state: WizardFlowModeState) => void;
  initialState: WizardFlowModeState;
}

export const WizardMode: React.FC<WizardModeProps> = ({
  applications,
  onStateChanged,
  initialState,
}) => {
  const { t } = useTranslation();

  const [flowMode, setFlowMode] = React.useState<WizardFlowMode>(
    initialState.flowMode
  );
  const [selectedProfile, setSelectedProfile] =
    React.useState<AnalysisProfile | null>(initialState.selectedProfile);

  // Fetch analysis profiles and archetypes
  const { analysisProfiles } = useFetchAnalysisProfiles();
  const { archetypes } = useFetchArchetypes();

  // Filter profiles based on user role and applications
  const availableProfiles = useAvailableAnalysisProfiles(
    applications,
    analysisProfiles,
    archetypes
  );

  // Check if all applications are compatible with the selected profile
  // Analysis profiles are source-code based (withDeps determines if dependencies are included)
  const areApplicationsCompatibleWithProfile = useMemo(() => {
    if (!selectedProfile || applications.length === 0) {
      return true;
    }

    // Profiles are source-code based, so check if all apps have repository.url
    const analysisMode = selectedProfile.mode?.withDeps
      ? "source-code-deps"
      : "source-code";

    return applications.every((app) => isModeSupported(app, analysisMode));
  }, [selectedProfile, applications]);

  // Calculate validity
  const isValid = useMemo(() => {
    if (flowMode === "manual") {
      return true;
    }
    // Profile mode: valid when a profile is selected and applications are compatible
    return selectedProfile !== null && areApplicationsCompatibleWithProfile;
  }, [flowMode, selectedProfile, areApplicationsCompatibleWithProfile]);

  // Notify parent of state changes
  useEffect(() => {
    onStateChanged({
      flowMode,
      selectedProfile,
      isValid,
    });
  }, [flowMode, selectedProfile, isValid, onStateChanged]);

  // Reset selected profile when switching to manual mode
  const handleFlowModeChange = (mode: WizardFlowMode) => {
    setFlowMode(mode);
    if (mode === "manual") {
      setSelectedProfile(null);
    }
  };

  const profileOptions = availableProfiles.map((profile) => ({
    value: String(profile.id),
    children: profile.name,
  }));

  return (
    <Form
      onSubmit={(event) => {
        event.preventDefault();
      }}
    >
      <TextContent>
        <Title headingLevel="h3" size="xl">
          {t("wizard.terms.wizardMode")}
        </Title>
        <Text>{t("wizard.label.selectWizardMode")}</Text>
      </TextContent>

      <FormGroup
        role="radiogroup"
        fieldId="wizard-mode-selection"
        className={spacing.mtMd}
      >
        <Radio
          id="wizard-mode-manual"
          name="wizard-mode"
          label={t("wizard.label.manualSelection")}
          description={t("wizard.label.manualModeDescription")}
          isChecked={flowMode === "manual"}
          onChange={() => handleFlowModeChange("manual")}
          className={spacing.mbMd}
        />
        <Radio
          id="wizard-mode-profile"
          name="wizard-mode"
          label={t("wizard.label.useAnalysisProfile")}
          description={t("wizard.label.profileModeDescription")}
          isChecked={flowMode === "profile"}
          onChange={() => handleFlowModeChange("profile")}
        />
      </FormGroup>

      {flowMode === "profile" && (
        <div className={spacing.mtLg}>
          {availableProfiles.length === 0 ? (
            <NoDataEmptyState
              title={t("wizard.label.noProfilesAvailable")}
              description={t("wizard.label.noProfilesAvailableDescription")}
            />
          ) : (
            <FormGroup
              label={t("wizard.label.selectAnalysisProfile")}
              fieldId="analysis-profile-select"
              isRequired
            >
              <SimpleSelectBasic
                selectId="analysis-profile-select"
                toggleId="analysis-profile-select-toggle"
                toggleAriaLabel="Analysis profile selection dropdown toggle"
                aria-label="Select analysis profile"
                value={selectedProfile ? String(selectedProfile.id) : undefined}
                onChange={(value) => {
                  const profile = availableProfiles.find(
                    (p) => String(p.id) === value
                  );
                  setSelectedProfile(profile ?? null);
                }}
                options={profileOptions}
                placeholderText={t("wizard.label.selectAnalysisProfile")}
              />
              {selectedProfile?.description && (
                <Text component="small" className={spacing.mtSm}>
                  {selectedProfile.description}
                </Text>
              )}
            </FormGroup>
          )}

          {selectedProfile && !areApplicationsCompatibleWithProfile && (
            <Alert
              variant="warning"
              isInline
              title={t("wizard.label.notAllAnalyzable")}
              className={spacing.mtMd}
            >
              <p>
                {t(
                  "wizard.label.profileRequiresSourceCode",
                  "The selected analysis profile requires all applications to have a source code repository configured. Some selected applications are missing a repository URL."
                )}
              </p>
            </Alert>
          )}
        </div>
      )}
    </Form>
  );
};
