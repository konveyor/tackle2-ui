import * as React from "react";
import {
  Alert,
  DropEvent,
  MultipleFileUpload,
  MultipleFileUploadMain,
  MultipleFileUploadStatusItem,
} from "@patternfly/react-core";
import UploadIcon from "@patternfly/react-icons/dist/esm/icons/upload-icon";
import { useFormContext } from "react-hook-form";

import {
  useCreateTaskgroupMutation,
  useRemoveUploadedFileMutation,
  useUploadFileTaskgroupMutation,
} from "@app/queries/taskgroups";
import { AxiosError } from "axios";
import { getAxiosErrorMessage } from "@app/utils/utils";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";
import { uploadLimit } from "@app/Constants";
import { NotificationsContext } from "@app/components/NotificationsContext";
import { AnalysisWizardFormValues } from "../schema";
import { useTaskGroup } from "./TaskGroupContext";
import { Taskgroup } from "@app/api/models";
import { defaultTaskgroup } from "../analysis-wizard";

export const UploadBinary: React.FC = () => {
  const { taskGroup, updateTaskGroup } = useTaskGroup();
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
  const onCreateTaskgroupSuccess = (data: Taskgroup) => {
    updateTaskGroup(data);
  };

  const onCreateTaskgroupError = (error: Error | unknown) => {
    console.log("Taskgroup creation failed: ", error);
    pushNotification({
      title: "Taskgroup creation failed",
      variant: "danger",
    });
  };

  const { mutateAsync: createTaskgroup } = useCreateTaskgroupMutation(
    onCreateTaskgroupSuccess,
    onCreateTaskgroupError
  );

  const handleFileDrop = (_: DropEvent, droppedFiles: File[]) => {
    if (droppedFiles[0]) {
      setError(undefined);
      setFileUploadProgress(0);
      setFileUploadStatus(undefined);
      const form = new FormData();
      form.append("file", droppedFiles[0]);
      if (!taskGroup) {
        createTaskgroup(defaultTaskgroup).then((data) => {
          updateTaskGroup(data);
          data.id &&
            uploadFile({
              id: data?.id,
              path: `binary/${droppedFiles[0].name}`,
              formData: form,
              file: droppedFiles[0],
            });
        });
      } else {
        taskGroup.id &&
          uploadFile({
            id: taskGroup?.id,
            path: `binary/${droppedFiles[0].name}`,
            formData: form,
            file: droppedFiles[0],
          });
      }
      readFile(droppedFiles[0])
        .then((data) => {
          if (data) {
            setFileUploadProgress(100);
            setFileUploadStatus("success");
            setValue("artifact", droppedFiles[0]);
          }
        })
        .catch((error) => {
          setValue("artifact", undefined);
          setFileUploadProgress(0);
          setFileUploadStatus("danger");
        });
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
      readFile(file).catch((error) => {
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
          accept: {
            "application/java-archive": [".war", ".ear", ".jar", ".zip"],
          },
          maxSize: uploadLimitInBytes,
        }}
      >
        {!artifact && (
          <MultipleFileUploadMain
            titleIcon={<UploadIcon />}
            titleText="Drag and drop file here"
            titleTextSeparator="or"
            infoText={
              <>
                <div>Accepted file types: war, ear, jar or zip</div>
                <div>
                  Upload size limit: {Math.round(uploadLimitInBytes / 1000000)}{" "}
                  MB
                </div>
              </>
            }
          />
        )}
        {artifact && (
          <MultipleFileUploadStatusItem
            file={artifact}
            key={artifact.name}
            customFileHandler={handleFile}
            onClearClick={() => {
              setFileUploadStatus(undefined);
              setFileUploadProgress(undefined);
              setValue("artifact", null);
              taskGroup?.id &&
                removeFile({
                  id: taskGroup?.id,
                  path: `binary/${artifact}`,
                });
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
