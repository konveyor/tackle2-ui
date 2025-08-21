import * as React from "react";
import { useTranslation } from "react-i18next";
import { useForm, useWatch, UseFormReturn } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";

import {
  Form,
  TextContent,
  Text,
  FormGroup,
  Radio,
} from "@patternfly/react-core";

import { Archetype, TargetProfile } from "@app/api/models";
import { DecoratedApplication } from "../useDecoratedApplications";
import { useFetchArchetypes } from "@app/queries/archetypes";

interface TargetProfileFormValues {
  selectedProfile?: TargetProfile;
}

export interface TargetProfileState {
  selectedProfile?: TargetProfile;
  isValid: boolean;
}

const useTargetProfileStateChangeHandler = (
  form: UseFormReturn<TargetProfileFormValues>,
  onTargetProfileChanged: (profileState: TargetProfileState) => void
) => {
  const {
    control,
    formState: { isValid },
  } = form;

  const watchedValues = useWatch({
    control,
    name: ["selectedProfile"],
  });

  const profileState = React.useMemo((): TargetProfileState => {
    const [selectedProfile] = watchedValues;
    return {
      selectedProfile,
      isValid,
    };
  }, [watchedValues, isValid]);

  React.useEffect(() => {
    onTargetProfileChanged(profileState);
  }, [onTargetProfileChanged, profileState]);
};

export const SelectTargetProfile: React.FC<{
  applications: DecoratedApplication[];
  onTargetProfileChanged: (profile: TargetProfile) => void;
  initialTargetProfile?: TargetProfile;
}> = ({ applications, onTargetProfileChanged, initialTargetProfile }) => {
  const { t } = useTranslation();
  const { archetypes } = useFetchArchetypes();

  const validationSchema = yup.object().shape({
    selectedProfile: yup.object().nullable().required(t("validation.required")),
  });

  const form = useForm<TargetProfileFormValues>({
    defaultValues: {
      selectedProfile: initialTargetProfile ?? undefined,
    },
    resolver: yupResolver(validationSchema),
    mode: "all",
  });
  const { setValue, control, watch } = form;

  // Get all unique target profiles from applications' archetypes
  const availableProfiles = React.useMemo(() => {
    const archeTypeAndProfile: {
      archetype: Archetype;
      profile: TargetProfile;
    }[] = [];

    applications.forEach((app) => {
      app.archetypes?.forEach((archetypeRef) => {
        const archetype = archetypes?.find((a) => a.id === archetypeRef.id);
        archetype?.profiles?.forEach((profile) => {
          archeTypeAndProfile.push({ archetype, profile });
        });
      });
    });

    return archeTypeAndProfile.sort((a, b) =>
      (a.archetype.name + a.profile.name).localeCompare(
        b.archetype.name + b.profile.name
      )
    );
  }, [applications, archetypes]);

  useTargetProfileStateChangeHandler(form, (state) => {
    if (state.isValid) {
      onTargetProfileChanged(state.selectedProfile!);
    }
  });

  const selectedProfileId = watch("selectedProfile")?.id;

  return (
    <div>
      <TextContent style={{ marginBottom: "var(--pf-v5-global--spacer--lg)" }}>
        <Text component="h3">
          {t("generateAssetsWizard.selectTargetProfile.title")}
        </Text>
        <Text component="p">
          {t("generateAssetsWizard.selectTargetProfile.description")}
        </Text>
      </TextContent>

      {availableProfiles.length === 0 ? (
        <div style={{ padding: "20px" }}>
          <Text>
            {t("generateAssetsWizard.selectTargetProfile.noProfilesAvailable")}
          </Text>
        </div>
      ) : (
        <Form>
          <FormGroup
            label={t("generateAssetsWizard.selectTargetProfile.profilesLabel")}
            fieldId="target-profile-selection"
          >
            {availableProfiles.map(({ archetype, profile }) => (
              <Radio
                key={profile.id}
                id={`profile-${profile.id}`}
                name="selectedProfile"
                label={`${archetype.name} - ${profile.name}`}
                description={t(
                  "generateAssetsWizard.selectTargetProfile.generatorCount",
                  {
                    count: profile.generators?.length || 0,
                  }
                )}
                isChecked={selectedProfileId === profile.id}
                onChange={() =>
                  setValue("selectedProfile", profile, { shouldValidate: true })
                }
              />
            ))}
          </FormGroup>
        </Form>
      )}
    </div>
  );
};
