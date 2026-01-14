import * as React from "react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Checkbox,
  Flex,
  FlexItem,
  Form,
  Text,
  TextContent,
  Title,
  Tooltip,
} from "@patternfly/react-core";
import { QuestionCircleIcon } from "@patternfly/react-icons";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";

import { AdvancedOptionsState } from "../schema";

interface OptionsProfileProps {
  onStateChanged: (state: AdvancedOptionsState) => void;
  initialState: AdvancedOptionsState;
}

/**
 * Simplified options step for profile mode.
 * Only includes auto-tagging and enhanced analysis details checkboxes.
 */
export const OptionsProfile: React.FC<OptionsProfileProps> = ({
  onStateChanged,
  initialState,
}) => {
  const { t } = useTranslation();

  const [autoTaggingEnabled, setAutoTaggingEnabled] = React.useState(
    initialState.autoTaggingEnabled
  );
  const [advancedAnalysisEnabled, setAdvancedAnalysisEnabled] = React.useState(
    initialState.advancedAnalysisEnabled
  );

  // Notify parent of state changes
  useEffect(() => {
    onStateChanged({
      // Keep existing values for unused fields
      ...initialState,
      // Update the changeable values
      autoTaggingEnabled,
      advancedAnalysisEnabled,
      // Always valid for this simplified step
      isValid: true,
    });
  }, [
    initialState,
    autoTaggingEnabled,
    advancedAnalysisEnabled,
    onStateChanged,
  ]);

  return (
    <Form
      onSubmit={(event) => {
        event.preventDefault();
      }}
    >
      <TextContent>
        <Title headingLevel="h3" size="xl">
          {t("wizard.terms.options")}
        </Title>
        <Text>{t("wizard.label.profileOptionsDescription")}</Text>
      </TextContent>

      <Checkbox
        className={spacing.mtLg}
        label={t("wizard.composed.enable", {
          what: t("wizard.terms.autoTagging").toLowerCase(),
        })}
        isChecked={autoTaggingEnabled}
        onChange={() => setAutoTaggingEnabled(!autoTaggingEnabled)}
        id="enable-auto-tagging-checkbox"
        name="autoTaggingEnabled"
      />

      <Flex>
        <FlexItem>
          <Checkbox
            className={spacing.mtMd}
            label={t("wizard.composed.enable", {
              what: t("wizard.terms.advancedAnalysisDetails").toLowerCase(),
            })}
            isChecked={advancedAnalysisEnabled}
            onChange={() =>
              setAdvancedAnalysisEnabled(!advancedAnalysisEnabled)
            }
            id="enable-advanced-analysis-details-checkbox"
            name="advancedAnalysisEnabled"
          />
        </FlexItem>
        <FlexItem>
          <Tooltip
            position="right"
            content={t("wizard.tooltip.advancedAnalysisDetails")}
          >
            <QuestionCircleIcon className={spacing.mlSm} />
          </Tooltip>
        </FlexItem>
      </Flex>
    </Form>
  );
};
