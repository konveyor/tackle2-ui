import * as React from "react";
import { useTranslation } from "react-i18next";
import { useForm, useWatch, UseFormReturn } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";

import {
  Form,
  TextContent,
  Text,
  PanelMainBody,
  PanelMain,
  Panel,
  Popover,
  Icon,
  Radio,
} from "@patternfly/react-core";
import { QuestionCircleIcon } from "@patternfly/react-icons";

import { HookFormPFGroupController } from "@app/components/HookFormPFFields";

export interface AdvancedOptionsState {
  isValid: boolean;
  renderTemplates: boolean;
}

interface AdvancedOptionsFormValues {
  renderTemplates: boolean;
}

const useAdvancedOptionsStateChangeHandler = (
  form: UseFormReturn<AdvancedOptionsFormValues>,
  onChanged: (parameterState: AdvancedOptionsState) => void
) => {
  const {
    control,
    formState: { isValid },
  } = form;

  const watchedValues = useWatch({
    control,
    name: ["renderTemplates"],
  });

  const parameterState = React.useMemo((): AdvancedOptionsState => {
    const [renderTemplates] = watchedValues;
    return {
      renderTemplates,
      isValid,
    };
  }, [watchedValues, isValid]);

  React.useEffect(() => {
    onChanged(parameterState);
  }, [onChanged, parameterState]);
};

export const AdvancedOptions: React.FC<{
  onStateChanged: (parameters: AdvancedOptionsState) => void;
  initialState?: AdvancedOptionsState;
}> = ({ onStateChanged, initialState }) => {
  const { t } = useTranslation();

  const validationSchema = yup.object().shape({
    renderTemplates: yup.boolean().required(),
  });

  const form = useForm<AdvancedOptionsFormValues>({
    defaultValues: {
      renderTemplates: initialState?.renderTemplates ?? true,
    },
    resolver: yupResolver(validationSchema),
    mode: "all",
  });
  const { control } = form;

  useAdvancedOptionsStateChangeHandler(form, onStateChanged);

  return (
    <>
      <TextContent style={{ marginBottom: "var(--pf-v5-global--spacer--lg)" }}>
        <Text component="h3">
          {t("generateAssetsWizard.advancedOptions.title")}
        </Text>

        <Text component="p">
          {t("generateAssetsWizard.advancedOptions.description")}
        </Text>
      </TextContent>

      <Panel>
        <PanelMain>
          <PanelMainBody>
            <Form isHorizontal>
              <HookFormPFGroupController
                control={control}
                name="renderTemplates"
                fieldId="renderTemplates"
                label={t(
                  "generateAssetsWizard.advancedOptions.renderTemplatesLabel"
                )}
                labelIcon={
                  <Popover
                    triggerAction="hover"
                    aria-label="render templates description popover"
                    bodyContent={t(
                      "generateAssetsWizard.advancedOptions.renderTemplatesPopover"
                    )}
                  >
                    <Icon isInline size="md">
                      <QuestionCircleIcon />
                    </Icon>
                  </Popover>
                }
                formGroupProps={{
                  isStack: true,
                  hasNoPaddingTop: true,
                }}
                renderInput={({ field: { value, name, onChange } }) => (
                  <>
                    <Radio
                      isChecked={value}
                      onChange={() => onChange(true)}
                      id={`${name}-true`}
                      name={name}
                      isLabelWrapped
                      label={t(
                        "generateAssetsWizard.advancedOptions.renderTemplates-true"
                      )}
                    />
                    <Radio
                      isChecked={!value}
                      onChange={() => onChange(false)}
                      id={`${name}-false`}
                      name={name}
                      isLabelWrapped
                      label={t(
                        "generateAssetsWizard.advancedOptions.renderTemplates-false"
                      )}
                    />
                  </>
                )}
              />
            </Form>
          </PanelMainBody>
        </PanelMain>
      </Panel>
    </>
  );
};
