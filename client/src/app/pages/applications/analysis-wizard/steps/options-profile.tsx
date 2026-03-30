import * as React from "react";
import { useTranslation } from "react-i18next";
import {
  Checkbox,
  Content,
  ContentVariants,
  Flex,
  FlexItem,
  Form,
  Tooltip,
} from "@patternfly/react-core";
import { QuestionCircleIcon } from "@patternfly/react-icons";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";

import { AdvancedOptionsState } from "@app/components/analysis/steps/options-advanced";

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
      <Content>
        <Content component={ContentVariants.h3}>
          {t("wizard.terms.options")}
        </Content>
        <Content component="p">
          {t("wizard.label.profileOptionsDescription")}
        </Content>
      </Content>

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
