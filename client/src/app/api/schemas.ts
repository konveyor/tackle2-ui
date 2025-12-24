import * as yup from "yup";

import { TargetLabel, UploadFile, UploadFileStatus } from "./models";

export const TargetLabelSchema: yup.SchemaOf<TargetLabel> = yup.object({
  name: yup.string().defined(),
  label: yup.string().defined(),
});

export const UploadFileSchema: yup.SchemaOf<UploadFile> = yup.object({
  fileId: yup.number().optional(),
  fileName: yup.string().required(),
  fullFile: yup.mixed<File>().required() as unknown as yup.SchemaOf<File>,
  uploadProgress: yup.number().required().min(0).max(100),
  status: yup
    .mixed<(typeof UploadFileStatus)[number]>()
    .oneOf([...UploadFileStatus])
    .required(),
  contents: yup.string().optional(),
  loadError: yup.string().optional(),
  responseID: yup.number().optional(),
});
