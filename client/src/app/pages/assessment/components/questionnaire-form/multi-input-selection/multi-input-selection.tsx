import React, { useMemo } from "react";
import { Radio, Stack, StackItem } from "@patternfly/react-core";

import { Question } from "@app/api/models";
import { HookFormPFGroupController } from "@app/components/HookFormPFFields";
import { useFormContext } from "react-hook-form";
import { getQuestionFieldName } from "../../../form-utils";
import { AssessmentWizardValues } from "@app/pages/assessment/components/assessment-wizard/assessment-wizard";

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
                label={option.text}
                value={option.text}
              />
            )}
          />
        </StackItem>
      ))}
    </Stack>
  );
};
