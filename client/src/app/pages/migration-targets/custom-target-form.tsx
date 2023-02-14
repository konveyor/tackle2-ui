import * as React from "react";
import {
  ActionGroup,
  Button,
  ButtonVariant,
  FileUpload,
  Form,
  Modal,
  ModalVariant,
} from "@patternfly/react-core";
import { useTranslation } from "react-i18next";
import { AxiosError, AxiosResponse } from "axios";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import Resizer from "react-image-file-resizer";

import {
  HookFormPFGroupController,
  HookFormPFTextInput,
} from "@app/shared/components/hook-form-pf-fields";
import { yupResolver } from "@hookform/resolvers/yup";
import { useState } from "react";
import { RuleBundle } from "@app/api/models";
import { useCreateImageFileMutation } from "@app/queries/rulebundles";

export interface CustomTargetFormProps {
  ruleBundle?: RuleBundle;
  isOpen: boolean;
  onClose: () => void;
  onSaved: (response: AxiosResponse<RuleBundle>) => void;
  onCancel: () => void;
}

interface CustomTargetFormValues {
  id: number;
  name: string;
  description: string;
  imageID: number;
  // rules: Rule[];
  // repository: any;
}

export const CustomTargetForm: React.FC<CustomTargetFormProps> = ({
  ruleBundle,
  isOpen,
  onClose,
  onSaved,
  onCancel,
}) => {
  const { t } = useTranslation();

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
      imageID: yup.number().defined().nullable(),
      //TODO rules validation
      // rules: yup.array().defined(),
      //TODO repo validation
      // repository: yup.object().shape({}).defined(),
    });

  const {
    handleSubmit,
    formState: { isSubmitting, isValidating, isValid, isDirty },
    getValues,
    setValue,
    setError,
    control,
    watch,
    resetField,
    reset,
  } = useForm<CustomTargetFormValues>({
    defaultValues: {
      name: ruleBundle?.name || "",
      description: ruleBundle?.description || "",
      id: ruleBundle?.id || 0,
    },
    resolver: yupResolver(validationSchema),
    mode: "onChange",
  });

  const onSubmit = (formValues: CustomTargetFormValues) => {
    const payload: RuleBundle = {
      name: formValues.name.trim(),
      description: formValues.description.trim(),
      id: formValues.id,
      image: { id: 0, name: "" },
      rulesets: [],
      custom: true,
    };
  };
  // IMAGE FILE UPLOAD
  const [filename, setFilename] = React.useState("");

  const onCreateImageFileSuccess = (response: any) => {
    //Set image ID for use in form submit
    setValue("imageID", response?.id);
  };

  const onCreateImageFileFailure = (error: AxiosError) => {
    resetField("imageID");
  };

  const { mutate: createImageFile } = useCreateImageFileMutation(
    onCreateImageFileSuccess,
    onCreateImageFileFailure
  );

  //

  return (
    <Modal
      title={
        ruleBundle
          ? t("dialog.title.new", {
              what: t("terms.customTarget").toLowerCase(),
            })
          : t("dialog.title.edit", {
              what: t("terms.customTarget").toLowerCase(),
            })
      }
      variant={ModalVariant.medium}
      isOpen={isOpen}
      onClose={onClose}
    >
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
          isRequired
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
                  createImageFile({ image: formFile, filename: file.name });
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
    </Modal>
  );
};
