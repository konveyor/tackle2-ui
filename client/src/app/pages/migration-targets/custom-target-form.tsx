import * as React from "react";
import {
  ActionGroup,
  Button,
  ButtonVariant,
  FileUpload,
  Form,
} from "@patternfly/react-core";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import Resizer from "react-image-file-resizer";

import {
  HookFormPFGroupController,
  HookFormPFTextInput,
} from "@app/shared/components/hook-form-pf-fields";
import { yupResolver } from "@hookform/resolvers/yup";
import { useEffect, useState } from "react";
import {
  BundleOrderSetting,
  IReadFile,
  RuleBundle,
  Ruleset,
  Setting,
  TableRule,
} from "@app/api/models";
import { AddCustomRules } from "@app/common/CustomRules/add-custom-rules";
import { parseRules } from "@app/common/CustomRules/rules-utils";
import {
  BundleOrderSettingKey,
  useCreateFileMutation,
  useCreateRuleBundleMutation,
  useFetchBundleOrder,
  useFetchRuleBundles,
  useUpdateRuleBundleMutation,
} from "@app/queries/rulebundles";
import { AxiosError } from "axios";

export interface CustomTargetFormProps {
  ruleBundle?: RuleBundle;
  onSaved: (ruleBundleResponseID: number) => void;
  onCancel: () => void;
}

interface CustomTargetFormValues {
  id: number;
  name: string;
  description: string;
  imageID: number;
  customRulesFiles: IReadFile[];
  // rules: Rule[];
  // repository: any;
}

export const CustomTargetForm: React.FC<CustomTargetFormProps> = ({
  ruleBundle: initialRuleBundle,
  onSaved,
  onCancel,
}) => {
  const { t } = useTranslation();
  const [readFileData, setReadFileData] = React.useState<IReadFile[]>([]);

  const [ruleBundle, setRuleBundle] = useState(initialRuleBundle);

  const [filename, setFilename] = React.useState("");

  const [isImageFileRejected, setIsImageFileRejected] = useState(false);

  const resizeFile = (file: File) =>
    new Promise<File>((resolve) => {
      const extension = file?.name?.split(".")[1];
      Resizer.imageFileResizer(
        file,
        80,
        80,
        extension,
        100,
        0,
        (uri) => {
          resolve(uri as File);
        },
        "file"
      );
    });

  const validationSchema: yup.SchemaOf<CustomTargetFormValues> = yup
    .object()
    .shape({
      id: yup.number().defined(),
      name: yup
        .string()
        .trim()
        .required(t("validation.required"))
        .min(3, t("validation.minLength", { length: 3 }))
        .max(120, t("validation.maxLength", { length: 120 })),
      // .test(
      //   "Duplicate name",
      //   "An identity with this name already exists. Please use a different name.",
      //   (value) =>
      //     duplicateNameCheck(identities, identity || null, value || "")
      // ),
      description: yup
        .string()
        .defined()
        .trim()
        .max(250, t("validation.maxLength", { length: 250 })),
      imageID: yup.number().defined().required(),
      //TODO rules validation
      // rules: yup.array().defined(),
      //TODO repo validation
      // repository: yup.object().shape({}).defined(),
      customRulesFiles: yup
        .array()
        .of(yup.object() as yup.SchemaOf<IReadFile>)
        .required(),
    });

  const {
    handleSubmit,
    formState: { isSubmitting, isValidating, isValid, isDirty, errors },
    getValues,
    setValue,
    setError,
    control,
    watch,
    resetField,
    reset,
  } = useForm<CustomTargetFormValues>({
    defaultValues: {
      id: ruleBundle?.id || 0,
      name: ruleBundle?.name || "",
      description: ruleBundle?.description || "",
      imageID: ruleBundle?.image.id || 0,
      customRulesFiles: [],
      // customRulesFiles: ruleBundle?.rulesets || [],
    },
    resolver: yupResolver(validationSchema),
    mode: "onChange",
  });

  useEffect(() => {
    setRuleBundle(initialRuleBundle);
    return () => {
      setRuleBundle(undefined);
      // setReadFileData([]);
      // setFilename("");
    };
  }, []);

  const watchAllFields = watch();

  // useEffect(() => {
  //   // Handle async initial value
  //   // https://stackoverflow.com/questions/64306943/defaultvalues-of-react-hook-form-is-not-setting-the-values-to-the-input-fields-i
  //   reset(ruleBundle);
  // }, [ruleBundle, reset]);

  const onSubmit = (formValues: CustomTargetFormValues) => {
    let rulesets: TableRule[] = [];
    let sources: string[] = [];
    let targets: string[] = [];

    readFileData.forEach((file) => {
      if (file.data) {
        const newRules = parseRules(file);
        rulesets = [...rulesets, ...newRules.parsedRules];
        if (newRules.parsedSource) {
          sources = [...sources, newRules.parsedSource];
        }
        if (newRules.parsedTarget) {
          targets = [...targets, newRules.parsedTarget];
        }
      }
    });

    const payload: RuleBundle = {
      id: formValues.id,
      name: formValues.name.trim(),
      description: formValues.description.trim(),
      image: { id: formValues.imageID },
      custom: true,
      rulesets: rulesets.map((ruleset): Ruleset => {
        return {
          name: ruleset.name,
          metadata: {
            target: ruleset.target ? ruleset.target : "",
            source: ruleset.source ? ruleset.source : "",
          },
          file: {
            id: ruleset.fileID ? ruleset.fileID : 0,
          },
        };
      }),
    };
    if (ruleBundle) {
      updateRuleBundle({ ...payload });
    } else {
      createRuleBundle(payload);
    }
  };

  const onCreateImageFileSuccess = (response: any) => {
    //Set image ID for use in form submit
    setValue("imageID", response?.id);
  };

  const onCreateImageFileFailure = (error: AxiosError) => {
    resetField("imageID");
  };

  const { mutate: createImageFile } = useCreateFileMutation(
    onCreateImageFileSuccess,
    onCreateImageFileFailure
  );

  const onCreateRuleBundleSuccess = (response: any) => {
    onSaved(response.id);
    reset();
  };

  const onCreateRuleBundleFailure = (error: AxiosError) => {};

  const { mutate: createRuleBundle } = useCreateRuleBundleMutation(
    onCreateRuleBundleSuccess,
    onCreateRuleBundleFailure
  );

  const onUpdateRuleBundleSuccess = (response: any) => {
    onSaved(response.id);
    reset();
  };

  const onUpdateRuleBundleFailure = (error: AxiosError) => {};

  const { mutate: updateRuleBundle } = useUpdateRuleBundleMutation(
    onUpdateRuleBundleSuccess,
    onUpdateRuleBundleFailure
  );

  //
  const values = getValues();
  console.log("values", values);
  return (
    <Form onSubmit={handleSubmit(onSubmit)}>
      <HookFormPFTextInput
        control={control}
        name="name"
        label="Name"
        fieldId="name"
        isRequired
      />
      <HookFormPFTextInput
        control={control}
        name="description"
        label="Description"
        fieldId="description"
      />
      <HookFormPFGroupController
        control={control}
        name="imageID"
        label={t("terms.image")}
        fieldId="custom-migration-target-upload-image"
        isRequired
        helperText="Upload a png or jpeg file"
        renderInput={({ field: { onChange, name } }) => (
          <FileUpload
            id="custom-migration-target-upload-image"
            name={name}
            value={filename}
            filename={filename}
            filenamePlaceholder="Drag and drop a file or upload one"
            dropzoneProps={{
              accept: ".png, .jpeg",
              maxSize: 1000000,
              onDropRejected: () => setIsImageFileRejected(true),
            }}
            validated={isImageFileRejected ? "error" : "default"}
            onFileInputChange={async (e, file) => {
              try {
                const image = await resizeFile(file);
                setFilename(image.name);
                const formFile = new FormData();
                formFile.append("file", file);

                const newImageFile: IReadFile = {
                  fileName: file.name,
                  fullFile: file,
                };

                createImageFile({ formData: formFile, file: newImageFile });
              } catch {
                resetField("imageID");
              }
            }}
            onClearClick={() => {
              onChange("");
              setFilename("");
              resetField("imageID");
              setIsImageFileRejected(false);
            }}
            browseButtonText="Upload"
          />
        )}
      />
      <HookFormPFGroupController
        control={control}
        name="customRulesFiles"
        label={t("terms.image")}
        fieldId="custom-migration-target-upload-image"
        isRequired
        renderInput={({ field: { onChange, name, value } }) => (
          <AddCustomRules
            readFileData={readFileData}
            setReadFileData={setReadFileData}
          />
        )}
      ></HookFormPFGroupController>

      <ActionGroup>
        <Button
          type="submit"
          aria-label="submit"
          id="identity-form-submit"
          variant={ButtonVariant.primary}
          isDisabled={!isValid || isSubmitting || isValidating || !isDirty}
        >
          {!ruleBundle ? t("actions.create") : t("actions.save")}
        </Button>
        <Button
          type="button"
          id="cancel"
          aria-label="cancel"
          variant={ButtonVariant.link}
          isDisabled={isSubmitting || isValidating}
          onClick={onCancel}
        >
          {t("actions.cancel")}
        </Button>
      </ActionGroup>
    </Form>
  );
};
