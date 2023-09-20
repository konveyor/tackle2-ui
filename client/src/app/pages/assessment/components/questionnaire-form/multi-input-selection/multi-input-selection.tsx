import React, { useMemo } from "react";
import { Icon, Radio, Stack, StackItem, Tooltip } from "@patternfly/react-core";
import InfoCircleIcon from "@patternfly/react-icons/dist/esm/icons/info-circle-icon";

import { Question } from "@app/api/models";
import { HookFormPFGroupController } from "@app/components/HookFormPFFields";
import { useFormContext } from "react-hook-form";
import { getQuestionFieldName } from "../../../form-utils";
import { AssessmentWizardValues } from "@app/pages/assessment/components/assessment-wizard/assessment-wizard";
import useIsArchetype from "@app/hooks/useIsArchetype";
import { useTranslation } from "react-i18next";

export interface MultiInputSelectionProps {
  question: Question;
}

export const MultiInputSelection: React.FC<MultiInputSelectionProps> = ({
  question,
}) => {
  const { control } = useFormContext<AssessmentWizardValues>();

  const sortedOptions = useMemo(() => {
    return (question.answers || []).sort((a, b) => a.order - b.order);
  }, [question]);

  const questionFieldName = getQuestionFieldName(question, true);

  const isArchetype = useIsArchetype();
  const { t } = useTranslation();

  return (
    <Stack>
      {sortedOptions.map((option, i) => (
        <StackItem key={option.text} className="pf-v5-u-pb-xs">
          <HookFormPFGroupController
            control={control}
            name={questionFieldName as `questions.${string}`}
            fieldId="stakeholders"
            renderInput={({ field: { value, onChange } }) => (
              <Radio
                id={`${option.text}`}
                name={questionFieldName}
                isChecked={value === option.text}
                onChange={(checked, e) => {
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
      ))}
    </Stack>
  );
};
