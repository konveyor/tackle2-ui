import { useMemo } from "react";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { object, string } from "yup";

import {
  Application,
  JsonDocument,
  New,
  TagRef,
  TargetedSchema,
} from "@app/api/models";
import { jsonSchemaToYupSchema } from "@app/components/schema-defined-fields/utils";
import { type RepositoryKind } from "@app/hooks/useRepositoryKind";
import { type TagItemType } from "@app/queries/tags";
import { duplicateNameCheck } from "@app/utils/utils";

import { useApplicationFormData } from "./useApplicationFormData";

export interface FormValues {
  id?: number;
  name: string;
  description: string;
  comments: string;
  businessServiceName: string;
  tags: TagItemType[];
  owner: string | null;
  contributors: string[];
  kind: RepositoryKind;
  sourceRepository: string;
  branch: string;
  rootPath: string;
  group: string;
  artifact: string;
  version: string;
  packaging: string;
  assetKind: RepositoryKind;
  assetRepository: string;
  assetBranch: string;
  assetRootPath: string;
  sourcePlatform?: string;
  coordinatesSchema?: TargetedSchema;
  coordinatesDocument?: JsonDocument;
}

export interface ApplicationFormProps {
  application: Application | null;
  data: ReturnType<typeof useApplicationFormData>;
}

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

export const useApplicationForm = ({
  application,
  data: {
    existingApplications,
    businessServiceToRef,
    stakeholderToRef,
    stakeholdersToRefs,
    tagItems,
    idsToTagRefs,
    createApplication,
    updateApplication,
    sourcePlatformToRef,
    sourcePlatformFromName,
  },
}: ApplicationFormProps) => {
  const { t } = useTranslation();

  const manualTagRefs: TagRef[] = useMemo(() => {
    return application?.tags?.filter((t) => !t?.source) ?? [];
  }, [application?.tags]);

  const nonManualTagRefs = useMemo(() => {
    return application?.tags?.filter((t) => (t?.source ?? "") !== "") ?? [];
  }, [application?.tags]);

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
        then: (schema) => schema.repositoryUrl("assetKind").required(),
      }),
      assetBranch: string()
        .trim()
        .max(250, t("validation.maxLength", { length: 250 })),
      assetRootPath: string()
        .trim()
        .max(250, t("validation.maxLength", { length: 250 })),

      // source platform and coordinates
      sourcePlatform: string().nullable(),
      coordinatesSchema: object().nullable(),
      coordinatesDocument: object().when(
        "coordinatesSchema",
        (coordinatesSchema: TargetedSchema | undefined) => {
          return coordinatesSchema
            ? jsonSchemaToYupSchema(coordinatesSchema.definition, t)
            : object().nullable();
        }
      ),
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

  const form = useForm<FormValues>({
    defaultValues: {
      id: application?.id,
      name: application?.name || "",
      description: application?.description || "",
      comments: application?.comments || "",
      businessServiceName: application?.businessService?.name || "",

      tags: manualTagRefs
        .map(({ id }) => tagItems.find((tag) => tag.id === id))
        .filter(Boolean),

      owner: application?.owner?.name || null,
      contributors:
        application?.contributors?.map((contributor) => contributor.name) || [],

      kind: (application?.repository?.kind ?? "") as RepositoryKind,
      sourceRepository: application?.repository?.url || "",
      branch: application?.repository?.branch || "",
      rootPath: application?.repository?.path || "",
      group: getBinaryInitialValue(application, "group"),
      artifact: getBinaryInitialValue(application, "artifact"),
      version: getBinaryInitialValue(application, "version"),
      packaging: getBinaryInitialValue(application, "packaging"),

      assetKind: (application?.assets?.kind ?? "") as RepositoryKind,
      assetRepository: application?.assets?.url || "",
      assetBranch: application?.assets?.branch || "",
      assetRootPath: application?.assets?.path || "",

      sourcePlatform: application?.platform?.name || "",
      coordinatesSchema: sourcePlatformFromName(application?.platform?.name)
        ?.coordinatesSchema,
      coordinatesDocument: application?.coordinates?.content,
    },
    resolver: yupResolver(validationSchema),
    mode: "all",
  });
  const {
    handleSubmit,
    formState: { isSubmitting, isValidating, isValid, isDirty },
  } = form;

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
            kind: formValues.kind?.trim(),
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

      platform: sourcePlatformToRef(formValues.sourcePlatform),
      ...(formValues.coordinatesDocument &&
        formValues.coordinatesSchema && {
          coordinates: {
            content: formValues.coordinatesDocument,
            schema: formValues.coordinatesSchema.name,
          },
        }),

      // Values not editable on the form but still need to be passed through
      identities: application?.identities ?? undefined,
      migrationWave: application?.migrationWave ?? null,
    };

    if (application) {
      updateApplication({ id: application.id, ...payload });
    } else {
      createApplication(payload);
    }
  };

  return {
    form,
    isSubmitDisabled: !isValid || isSubmitting || isValidating || !isDirty,
    isCancelDisabled: isSubmitting || isValidating,
    onSubmit: handleSubmit(onValidSubmit),
  };
};
