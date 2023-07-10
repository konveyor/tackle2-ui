import React, { useMemo } from "react";
import { Radio, Stack, StackItem } from "@patternfly/react-core";

import { Question } from "@app/api/models";
import { getQuestionFieldName } from "../../../form-utils";
import { HookFormPFGroupController } from "@app/shared/components/hook-form-pf-fields";
import { useFormContext } from "react-hook-form";
import { ApplicationAssessmentWizardValues } from "../../application-assessment-wizard/application-assessment-wizard";

export interface MultiInputSelectionProps {
  question: Question;
}

export const MultiInputSelection: React.FC<MultiInputSelectionProps> = ({
  question,
}) => {
  const { control } = useFormContext<ApplicationAssessmentWizardValues>();

  const sortedOptions = useMemo(() => {
    return (question.options || []).sort((a, b) => a.order - b.order);
  }, [question]);

  const questionFieldName = getQuestionFieldName(question, true);
  return (
    <Stack>
      {sortedOptions.map((option, i) => (
        <StackItem key={option.id} className="pf-v5-u-pb-xs">
          <HookFormPFGroupController
            control={control}
            name={questionFieldName as `questions.${string}`}
            fieldId="stakeholders"
            renderInput={({ field: { value, onChange } }) => (
              <Radio
                id={`${option.id}`}
                name={questionFieldName}
                isChecked={value === option.id}
                onChange={(checked, e) => {
                  onChange(option.id);
                }}
                label={option.option}
                value={option.id}
              />
            )}
          />
        </StackItem>
      ))}
    </Stack>
  );
};
