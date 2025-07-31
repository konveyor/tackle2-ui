import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { object, string } from "yup";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";

import { Application, New, TagRef } from "@app/api/models";
import { duplicateNameCheck } from "@app/utils/utils";
import { useApplicationFormData } from "./useApplicationFormData";
import { type TagItemType } from "@app/queries/tags";

export interface FormValues {
  id: number;
  name: string;
  description: string;
  comments: string;
  businessServiceName: string;
  tags: TagItemType[];
  owner: string | null;
  contributors: string[];
  kind: string;
  sourceRepository: string;
  branch: string;
  rootPath: string;
  group: string;
  artifact: string;
  version: string;
  packaging: string;
  sourcePlatform: string;
  assetKind: string;
  assetRepository: string;
  assetBranch: string;
  assetRootPath: string;
}

export interface ApplicationFormProps {
  application: Application | null;
  onClose: () => void;
}

export const useApplicationForm = ({
  application,
  onClose,
}: ApplicationFormProps) => {
  const { t } = useTranslation();
  const {
    existingApplications,
    businessServices,
    businessServiceToRef,
    stakeholders,
    stakeholderToRef,
    stakeholdersToRefs,
    tagItems,
    idsToTagRefs,
    createApplication,
    updateApplication,
    sourcePlatforms,
    sourcePlatformToRef,
  } = useApplicationFormData({
    onActionSuccess: onClose,
  });

  const businessServiceOptions = businessServices.map((businessService) => {
    return {
      value: businessService.name,
      toString: () => businessService.name,
    };
  });

  const sourcePlatformOptions = sourcePlatforms.map((sourcePlatform) => {
    return {
      value: sourcePlatform.name,
      toString: () => sourcePlatform.name,
    };
  });

  const stakeholdersOptions = stakeholders.map((stakeholder) => {
    return {
      value: stakeholder.name,
      toString: () => stakeholder.name,
    };
  });

  const manualTagRefs: TagRef[] = useMemo(() => {
    return application?.tags?.filter((t) => !t?.source) ?? [];
  }, [application?.tags]);

  const nonManualTagRefs = useMemo(() => {
    return application?.tags?.filter((t) => t?.source ?? "" !== "") ?? [];
  }, [application?.tags]);

  const getBinaryInitialValue = (
    application: Application | null,
    fieldName: string
  ) => {
    const binaryString = application?.binary?.startsWith("mvn://")
      ? application.binary.substring(6)
      : application?.binary;

    const fieldList = binaryString?.split(":") || [];

    switch (fieldName) {
      case "group":
        return fieldList[0] || "";
      case "artifact":
        return fieldList[1] || "";
      case "version":
        return fieldList[2] || "";
      case "packaging":
        return fieldList[3] || "";
      default:
        return "";
    }
  };

  const validationSchema = object().shape(
    {
      name: string()
        .trim()
        .required(t("validation.required"))
        .min(3, t("validation.minLength", { length: 3 }))
        .max(120, t("validation.maxLength", { length: 120 }))
        .test(
          "Duplicate name",
          "An application with this name already exists. Use a different name.",
          (value) =>
            duplicateNameCheck(
              existingApplications,
              application || null,
              value || ""
            )
        ),
      description: string()
        .trim()
        .max(250, t("validation.maxLength", { length: 250 })),
      businessService: object()
        .shape({
          id: string()
            .trim()
            .max(250, t("validation.maxLength", { length: 250 })),
          value: string()
            .trim()
            .max(250, t("validation.maxLength", { length: 250 })),
        })
        .nullable(),
      comments: string()
        .trim()
        .max(250, t("validation.maxLength", { length: 250 })),

      // source code fields
      kind: string().oneOf(["", "git", "subversion"]),
      sourceRepository: string().when("kind", {
        is: (kind: string) => kind !== "",
        then: (schema) => schema.repositoryUrl("kind").required(),
      }),
      branch: string()
        .trim()
        .max(250, t("validation.maxLength", { length: 250 })),
      rootPath: string()
        .trim()
        .max(250, t("validation.maxLength", { length: 250 })),

      // binary fields
      group: string()
        .when("artifact", {
          is: (artifact: string) => artifact?.length > 0,
          then: (schema) => schema.required("This field is required."),
          otherwise: (schema) => schema.trim(),
        })
        .when("version", {
          is: (version: string) => version?.length > 0,
          then: (schema) => schema.required("This field is required."),
          otherwise: (schema) => schema.trim(),
        }),
      artifact: string()
        .when("group", {
          is: (group: string) => group?.length > 0,
          then: (schema) => schema.required("This field is required."),
          otherwise: (schema) => schema.trim(),
        })
        .when("version", {
          is: (version: string) => version?.length > 0,
          then: (schema) => schema.required("This field is required."),
          otherwise: (schema) => schema.trim(),
        }),
      version: string()
        .when("group", {
          is: (group: string) => group?.length > 0,
          then: (schema) => schema.required("This field is required."),
          otherwise: (schema) => schema.trim(),
        })
        .when("artifact", {
          is: (artifact: string) => artifact?.length > 0,
          then: (schema) => schema.required("This field is required."),
          otherwise: (schema) => schema.trim(),
        }),

      // asset repository fields
      assetKind: string().oneOf(["", "git", "subversion"]),
      assetRepository: string().when("assetKind", {
        is: (kind: string) => kind !== "",
        then: (schema) => schema.repositoryUrl("kind").required(),
      }),
      assetBranch: string()
        .trim()
        .max(250, t("validation.maxLength", { length: 250 })),
      assetRootPath: string()
        .trim()
        .max(250, t("validation.maxLength", { length: 250 })),

      // TODO: Add source platform coordinates
    },
    [
      ["version", "group"],
      ["version", "artifact"],
      ["artifact", "group"],
      ["artifact", "version"],
      ["group", "artifact"],
      ["group", "version"],
    ]
  );

  const {
    handleSubmit,
    trigger,
    formState: { isSubmitting, isValidating, isValid, isDirty },
    control,
  } = useForm<FormValues>({
    defaultValues: {
      name: application?.name || "",
      description: application?.description || "",
      id: application?.id || 0,
      comments: application?.comments || "",
      businessServiceName: application?.businessService?.name || "",

      tags: manualTagRefs
        .map(({ id }) => tagItems.find((tag) => tag.id === id))
        .filter(Boolean),

      owner: application?.owner?.name || undefined,
      contributors:
        application?.contributors?.map((contributor) => contributor.name) || [],

      kind: application?.repository?.kind || "",
      sourceRepository: application?.repository?.url || "",
      branch: application?.repository?.branch || "",
      rootPath: application?.repository?.path || "",
      group: getBinaryInitialValue(application, "group"),
      artifact: getBinaryInitialValue(application, "artifact"),
      version: getBinaryInitialValue(application, "version"),
      packaging: getBinaryInitialValue(application, "packaging"),
      sourcePlatform: application?.platform?.name || "",
      assetKind: application?.assets?.kind || "",
      assetRepository: application?.assets?.url || "",
      assetBranch: application?.assets?.branch || "",
      assetRootPath: application?.assets?.path || "",
      // TODO: Add source platform coordinates
    },
    resolver: yupResolver(validationSchema),
    mode: "all",
  });

  const onValidSubmit = (formValues: FormValues) => {
    const binaryValues = [
      formValues.group,
      formValues.artifact,
      formValues.version,
      formValues.packaging,
    ].filter(Boolean);

    const payload: New<Application> = {
      name: formValues.name.trim(),
      description: formValues.description.trim(),
      comments: formValues.comments.trim(),

      businessService: businessServiceToRef(formValues.businessServiceName),

      // Note: We need to manually retain the non-manual tags in the payload
      tags: [
        ...(idsToTagRefs(formValues.tags.map((t) => t.id)) ?? []),
        ...nonManualTagRefs,
      ],

      owner: stakeholderToRef(formValues.owner),
      contributors: stakeholdersToRefs(formValues.contributors),

      repository: formValues.sourceRepository
        ? {
            kind: formValues.kind.trim(),
            url: formValues.sourceRepository.trim(),
            branch: formValues.branch.trim(),
            path: formValues.rootPath.trim(),
          }
        : undefined,
      binary:
        binaryValues.length > 0 ? `mvn://${binaryValues.join(":")}` : undefined,

      ...(formValues.assetKind && {
        assets: {
          kind: formValues.assetKind.trim(),
          url: formValues.assetRepository.trim(),
          branch: formValues.assetBranch.trim(),
          path: formValues.assetRootPath.trim(),
        },
      }),

      // TODO: Add source platform coordinates

      // Values not editable on the form but still need to be passed through
      identities: application?.identities ?? undefined,
      migrationWave: application?.migrationWave ?? null,
      platform: sourcePlatformToRef(formValues.sourcePlatform),
    };

    if (application) {
      updateApplication({ id: application.id, ...payload });
    } else {
      createApplication(payload);
    }
  };

  const [isBasicExpanded, setBasicExpanded] = React.useState(true);
  const [isSourceCodeExpanded, setSourceCodeExpanded] = React.useState(false);
  const [isBinaryExpanded, setBinaryExpanded] = React.useState(false);
  const [isSourcePlatformExpanded, setSourcePlatformExpanded] =
    React.useState(true);
  const [isAssetRepositoryExpanded, setAssetRepositoryExpanded] =
    React.useState(false);

  const kindOptions = [
    {
      value: "git",
      toString: () => `Git`,
    },
    {
      value: "subversion",
      toString: () => `Subversion`,
    },
  ];

  return {
    handleSubmit,
    onValidSubmit,
    setBasicExpanded,
    isBasicExpanded,
    trigger,
    control,
    tagItems,
    stakeholdersOptions,
    setSourceCodeExpanded,
    isSourceCodeExpanded,
    kindOptions,
    setBinaryExpanded,
    isBinaryExpanded,
    isSubmitDisabled: !isValid || isSubmitting || isValidating || !isDirty,
    isCancelDisabled: isSubmitting || isValidating,
    stakeholders,
    businessServiceOptions,
    sourcePlatformOptions,
    setSourcePlatformExpanded,
    isSourcePlatformExpanded,
    setAssetRepositoryExpanded,
    isAssetRepositoryExpanded,
    onSubmit: handleSubmit(onValidSubmit),
  };
};
