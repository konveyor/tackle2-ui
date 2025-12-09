import * as React from "react";
import { AxiosError } from "axios";
import {
  Alert,
  DropEvent,
  MultipleFileUpload,
  MultipleFileUploadMain,
  MultipleFileUploadStatusItem,
} from "@patternfly/react-core";
import { UploadIcon } from "@patternfly/react-icons/dist/esm/icons/upload-icon";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";

import { uploadLimit } from "@app/Constants";
import { Taskgroup } from "@app/api/models";
import { NotificationsContext } from "@app/components/NotificationsContext";
import {
  useRemoveTaskgroupFileMutation,
  useUploadTaskgroupFileMutation,
} from "@app/queries/taskgroups";
import { getAxiosErrorMessage } from "@app/utils/utils";

const readFile = (file: File, onProgress: (percent: number) => void) => {
  return new Promise<string | null>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.onprogress = (data) => {
      if (data.lengthComputable) {
        onProgress((data.loaded / data.total) * 100);
      }
    };
    reader.readAsDataURL(file);
  });
};

interface UploadBinaryProps {
  ensureTaskGroup: () => Promise<Taskgroup>;
  taskGroupId: number | undefined;
  artifact: File | null | undefined;
  onArtifactChange: (artifact: File | null) => void;
}

export const UploadBinary: React.FC<UploadBinaryProps> = ({
  ensureTaskGroup,
  taskGroupId,
  artifact,
  onArtifactChange,
}) => {
  const { pushNotification } = React.useContext(NotificationsContext);

  const [errorMessage, setErrorMessage] = React.useState<string>();

  const [fileUploadProgress, setFileUploadProgress] = React.useState<
    number | undefined
  >(artifact ? (artifact.size > 0 ? 100 : undefined) : undefined);

  const [fileUploadStatus, setFileUploadStatus] = React.useState<
    "danger" | "success" | "warning" | undefined
  >(artifact ? "success" : undefined);

  const uploadLimitInBytes = parseInt(uploadLimit.slice(0, -1)) * 1_000_000;

  const completedUpload = () => {
    pushNotification({
      title: "Uploaded binary file.",
      variant: "success",
    });

    setErrorMessage(undefined);
    setFileUploadProgress(100);
    setFileUploadStatus("success");
  };

  const failedUpload = (error: AxiosError) => {
    pushNotification({
      title: "Failed",
      message: "Binary file upload failed.",
      variant: "danger",
    });

    setErrorMessage(getAxiosErrorMessage(error));
    setFileUploadProgress(0);
    setFileUploadStatus("danger");
  };

  const { mutate: uploadFile } = useUploadTaskgroupFileMutation(
    completedUpload,
    failedUpload
  );

  const completedRemove = () => {
    pushNotification({
      title: "Removed binary file.",
      variant: "success",
    });

    setErrorMessage(undefined);
    setFileUploadProgress(0);
    setFileUploadStatus(undefined);
    onArtifactChange(null);
  };

  const failedRemove = (error: AxiosError) => {
    pushNotification({
      title: "Failed",
      message: "Binary file removal failed.",
      variant: "danger",
    });

    setErrorMessage(getAxiosErrorMessage(error));
    setFileUploadStatus("danger");
    setFileUploadProgress(0);
  };

  const { mutate: removeFile } = useRemoveTaskgroupFileMutation(
    completedRemove,
    failedRemove
  );

  // -----> upload file handling (drop -> handleFile -> read -> upload)
  const handleFileDrop = (_: DropEvent, droppedFiles: File[]) => {
    const droppedFile = droppedFiles[0];
    if (!droppedFile) {
      return;
    }

    setErrorMessage(undefined);
    setFileUploadProgress(0);
    setFileUploadStatus(undefined);
    onArtifactChange(droppedFile);
  };

  const readAndUploadFile = async (file: File) => {
    try {
      await readFile(
        file,
        (percent) => setFileUploadProgress(Math.round(20 * percent)) // first 20% is reading the file
      );

      // Ensure taskgroup exists and get its ID
      const taskgroup = await ensureTaskGroup();

      // TODO: Provide an onUploadProgress handler so the actual upload can be tracked from 20% to 100%
      uploadFile({
        id: taskgroup.id,
        path: `binary/${file.name}`,
        file,
      }); // remaining 80% is uploading the file
    } catch (e) {
      setErrorMessage((e as Error).message);
      setFileUploadProgress(0);
      setFileUploadStatus("danger");
    }
  };

  const removeUploadedFile = (file: File) => {
    if (taskGroupId) {
      removeFile({
        id: taskGroupId,
        path: `binary/${file.name}`,
      });
    }
  };
  // <---- upload file handling

  return (
    <>
      {errorMessage && (
        <Alert
          className={`${spacing.mtMd} ${spacing.mbMd}`}
          variant="danger"
          isInline
          title={errorMessage}
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
                  Upload size limit:
                  {Math.round(uploadLimitInBytes / 1_000_000)} MB
                </div>
              </>
            }
          />
        )}
        {artifact && (
          <MultipleFileUploadStatusItem
            key={artifact.name}
            file={artifact}
            customFileHandler={readAndUploadFile}
            onClearClick={() => removeUploadedFile(artifact)}
            progressAriaLabel={"text"}
            progressValue={fileUploadProgress}
            progressVariant={fileUploadStatus}
          />
        )}
      </MultipleFileUpload>
    </>
  );
};
