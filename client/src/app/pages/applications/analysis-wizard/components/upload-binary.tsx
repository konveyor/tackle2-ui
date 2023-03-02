import * as React from "react";
import {
  Alert,
  MultipleFileUpload,
  MultipleFileUploadMain,
  MultipleFileUploadStatusItem,
} from "@patternfly/react-core";
import UploadIcon from "@patternfly/react-icons/dist/esm/icons/upload-icon";
import { useFormContext } from "react-hook-form";

import {
  useRemoveUploadedFileMutation,
  useUploadFileTaskgroupMutation,
} from "@app/queries/taskgroups";
import { AxiosError } from "axios";
import { getAxiosErrorMessage } from "@app/utils/utils";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";
import { uploadLimit } from "@app/Constants";
import { NotificationsContext } from "@app/shared/notifications-context";
import { AnalysisWizardFormValues } from "../schema";

interface IUploadBinary {
  taskgroupID: number;
}

export const UploadBinary: React.FC<IUploadBinary> = ({ taskgroupID }) => {
  const { setValue, watch } = useFormContext<AnalysisWizardFormValues>();
  const artifact = watch("artifact");

  const [error, setError] = React.useState<AxiosError>();

  const [fileUploadProgress, setFileUploadProgress] = React.useState<
    number | undefined
  >(artifact ? (artifact.size > 0 ? 100 : undefined) : undefined);

  const [fileUploadStatus, setFileUploadStatus] = React.useState<
    "danger" | "success" | "warning" | undefined
  >(artifact ? "success" : undefined);

  const { pushNotification } = React.useContext(NotificationsContext);

  const completedUpload = () => {
    pushNotification({
      title: "Uploaded binary file.",
      variant: "success",
    });
    setFileUploadStatus("success");
    setFileUploadProgress(100);
  };

  const failedUpload = (error: AxiosError) => {
    pushNotification({
      title: "Failed",
      message: "Binary file upload failed.",
      variant: "danger",
    });
    setFileUploadStatus("danger");
    setFileUploadProgress(0);
    setError(error);
  };

  const completedRemove = () => {
    pushNotification({
      title: "Removed binary file.",
      variant: "success",
    });
    setFileUploadStatus(undefined);
    setFileUploadProgress(undefined);
    setValue("artifact", null);
  };

  const failedRemove = (error: AxiosError) => {
    pushNotification({
      title: "Failed",
      message: "Binary file removal failed.",
      variant: "danger",
    });
    setFileUploadStatus("danger");
    setFileUploadProgress(0);
    setError(error);
  };

  const { mutate: uploadFile } = useUploadFileTaskgroupMutation(
    completedUpload,
    failedUpload
  );

  const { mutate: removeFile } = useRemoveUploadedFileMutation(
    completedRemove,
    failedRemove
  );

  const handleFileDrop = (droppedFiles: File[]) => {
    if (droppedFiles[0]) {
      setError(undefined);
      setFileUploadProgress(0);
      setFileUploadStatus(undefined);
      const form = new FormData();
      form.append("file", droppedFiles[0]);
      uploadFile({
        id: taskgroupID,
        path: `binary/${droppedFiles[0].name}`,
        formData: form,
        file: droppedFiles[0],
      });
      setValue("artifact", droppedFiles[0]);
    }
  };

  const uploadLimitInBytes =
    parseInt(uploadLimit.slice(0, -1)) * Math.pow(1024, 2);

  const readFile = (file: File) => {
    return new Promise<string | null>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.onprogress = (data) => {
        if (data.lengthComputable) {
          setFileUploadProgress((data.loaded / data.total) * 100);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFile = (file: File) => {
    if (!artifact)
      readFile(file).catch((error: DOMException) => {
        setValue("artifact", undefined);
        setFileUploadProgress(0);
        setFileUploadStatus("danger");
      });
  };

  return (
    <>
      {error && (
        <Alert
          className={`${spacing.mtMd} ${spacing.mbMd}`}
          variant="danger"
          isInline
          title={getAxiosErrorMessage(error)}
        />
      )}
      <MultipleFileUpload
        onFileDrop={handleFileDrop}
        dropzoneProps={{
          accept: ".war, .ear, .jar, .zip",
          maxSize: uploadLimitInBytes,
        }}
      >
        <MultipleFileUploadMain
          titleIcon={<UploadIcon />}
          titleText="Drag and drop file here"
          titleTextSeparator="or"
          infoText={
            <>
              <div>Accepted file types: war, ear, jar or zip</div>
              <div>
                Upload size limit: {Math.round(uploadLimitInBytes / 1000000)} MB
              </div>
            </>
          }
        />
        {artifact && (
          <MultipleFileUploadStatusItem
            file={artifact}
            key={artifact.name}
            customFileHandler={handleFile}
            onClearClick={() => {
              removeFile({
                id: taskgroupID,
                path: `binary/${artifact}`,
              });
              setValue("artifact", null);
            }}
            progressAriaLabel={"text"}
            progressValue={fileUploadProgress}
            progressVariant={fileUploadStatus}
          />
        )}
      </MultipleFileUpload>
    </>
  );
};
