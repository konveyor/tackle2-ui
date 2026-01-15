import * as React from "react";
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
  state: AdvancedOptionsState;
}

/**
 * Simplified options step for profile mode.
 * Only includes auto-tagging and enhanced analysis details checkboxes.
 */
export const OptionsProfile: React.FC<OptionsProfileProps> = ({
  onStateChanged,
  state,
}) => {
  const { t } = useTranslation();

  const setAutoTaggingEnabled = (value: boolean) => {
    onStateChanged({
      ...state,
      autoTaggingEnabled: value,
      isValid: true,
    });
  };

  const setAdvancedAnalysisEnabled = (value: boolean) => {
    onStateChanged({
      ...state,
      advancedAnalysisEnabled: value,
      isValid: true,
    });
  };

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
        isChecked={state.autoTaggingEnabled}
        onChange={() => setAutoTaggingEnabled(!state.autoTaggingEnabled)}
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
            isChecked={state.advancedAnalysisEnabled}
            onChange={() =>
              setAdvancedAnalysisEnabled(!state.advancedAnalysisEnabled)
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
