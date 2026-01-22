import * as React from "react";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import * as yup from "yup";
import { Form, Text, TextContent, Title } from "@patternfly/react-core";

import { AnalysisProfile } from "@app/api/models";
import { HookFormPFTextInput } from "@app/components/HookFormPFFields";
import { useFormChangeHandler } from "@app/hooks/useFormChangeHandler";
import { useFetchAnalysisProfiles } from "@app/queries/analysis-profiles";
import { duplicateNameCheck } from "@app/utils/utils";

export interface ProfileDetailsValues {
  name: string;
  description?: string;
}

export interface ProfileDetailsState extends ProfileDetailsValues {
  isValid: boolean;
}

export const useProfileDetailsSchema = ({
  existingProfiles = [],
  currentProfile = null,
}: {
  existingProfiles?: AnalysisProfile[];
  currentProfile?: AnalysisProfile | null;
}): yup.SchemaOf<ProfileDetailsValues> => {
  const { t } = useTranslation();

  return yup.object().shape({
    name: yup
      .string()
      .required()
      .min(3, t("validation.minLength", { length: 3 }))
      .test(
        "unique-name",
        t("validation.duplicateAnalysisProfileName"),
        (value) =>
          duplicateNameCheck(existingProfiles, currentProfile, value ?? "")
      ),
    description: yup
      .string()
      .max(250, t("validation.maxLength", { length: 250 })),
  });
};

interface ProfileDetailsProps {
  analysisProfile: AnalysisProfile | null;
  onStateChanged: (state: ProfileDetailsState) => void;
  initialState: ProfileDetailsState;
}

export const ProfileDetails: React.FC<ProfileDetailsProps> = ({
  analysisProfile,
  onStateChanged,
  initialState,
}) => {
  const { t } = useTranslation();
  const { analysisProfiles } = useFetchAnalysisProfiles();
  const schema = useProfileDetailsSchema({
    existingProfiles: analysisProfiles,
    currentProfile: analysisProfile,
  });
  const form = useForm<ProfileDetailsValues>({
    defaultValues: {
      name: initialState.name,
      description: initialState.description,
    },
    mode: "all",
    resolver: yupResolver(schema),
  });
  useFormChangeHandler({ form, onStateChanged });

  const { control } = form;

  return (
    <Form
      isHorizontal
      onSubmit={(event) => {
        event.preventDefault();
      }}
    >
      <TextContent>
        <Title headingLevel="h3" size="xl">
          {t("analysisProfileWizard.steps.profileDetails.title")}
        </Title>
        <Text>
          {t("analysisProfileWizard.steps.profileDetails.description")}
        </Text>
      </TextContent>

      <HookFormPFTextInput
        control={control}
        name="name"
        label={t("terms.name")}
        fieldId="analysis-profile-name"
        isRequired
      />

      <HookFormPFTextInput
        control={control}
        name="description"
        label={t("terms.description")}
        fieldId="analysis-profile-description"
      />
    </Form>
  );
};
