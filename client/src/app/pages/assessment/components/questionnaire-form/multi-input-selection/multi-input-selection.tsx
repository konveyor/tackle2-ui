import React, { useMemo } from "react";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Icon, Radio, Stack, StackItem, Tooltip } from "@patternfly/react-core";
import InfoCircleIcon from "@patternfly/react-icons/dist/esm/icons/info-circle-icon";

import { QuestionWithSectionOrder } from "@app/api/models";
import { HookFormPFGroupController } from "@app/components/HookFormPFFields";
import useIsArchetype from "@app/hooks/useIsArchetype";
import { AssessmentWizardValues } from "@app/pages/assessment/components/assessment-wizard/assessment-wizard";
import { useWithUiId } from "@app/utils/query-utils";

import { getQuestionFieldName } from "../../../form-utils";

export interface MultiInputSelectionProps {
  question: QuestionWithSectionOrder;
}

export const MultiInputSelection: React.FC<MultiInputSelectionProps> = ({
  question,
}) => {
  const { control } = useFormContext<AssessmentWizardValues>();

  const sortedOptions = useMemo(() => {
    return (question.answers || []).sort((a, b) => a.order - b.order);
  }, [question]);

  const optionsWithUiId = useWithUiId(
    sortedOptions,
    (option) => `${question.order}-${option.order}`
  );

  const questionFieldName = getQuestionFieldName(question, true);

  const isArchetype = useIsArchetype();
  const { t } = useTranslation();
  return (
    <Stack>
      {optionsWithUiId.map((option) => {
        const answerUniqueId = `${questionFieldName}-${option._ui_unique_id}`;
        return (
          <StackItem key={option._ui_unique_id} className="pf-v5-u-pb-xs">
            <HookFormPFGroupController
              control={control}
              name={questionFieldName as `questions.${string}`}
              fieldId={answerUniqueId}
              renderInput={({ field: { value, onChange } }) => (
                <Radio
                  id={answerUniqueId}
                  name={questionFieldName}
                  isChecked={value === option.text}
                  onChange={() => {
                    onChange(option.text);
                  }}
                  aria-label={option.text}
                  label={
                    <>
                      {option.autoAnswered && option.autoAnswerFor?.length ? (
                        <Tooltip
                          content={t(
                            isArchetype
                              ? "message.selectedBecauseArchetypeTags"
                              : "message.selectedBecauseAppOrArchetypeTags",
                            {
                              tags: option.autoAnswerFor
                                .map((t) => `"${t.tag}"`)
                                .join(", "),
                            }
                          )}
                        >
                          <Icon status="info">
                            <InfoCircleIcon />
                          </Icon>
                        </Tooltip>
                      ) : null}{" "}
                      {option.text}
                    </>
                  }
                  value={option.text}
                />
              )}
            />
          </StackItem>
        );
      })}
    </Stack>
  );
};
