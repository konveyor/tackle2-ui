import * as React from "react";
import {
  Alert,
  Modal,
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
  const initialCurrentFile = new File([""], artifact, { type: "text/html" });

  const [currentFile, setCurrentFile] = React.useState<File | null>(
    artifact ? initialCurrentFile : null
  );

  const [modalText, setModalText] = React.useState("");
  const [error, setError] = React.useState<AxiosError>();

  const [fileUploadProgress, setFileUploadProgress] = React.useState<
    number | undefined
  >(undefined);

  const [fileUploadStatus, setFileUploadStatus] = React.useState<
    "danger" | "success" | "warning" | undefined
  >(undefined);

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
    setFileUploadStatus("success");
    setFileUploadProgress(100);
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
        file: form,
      });
      setValue("artifact", droppedFiles[0].name as string);
      setCurrentFile(droppedFiles[0]);
    }
  };

  const handleDropRejected = (
    files: File[],
    _event: React.DragEvent<HTMLElement>
  ) => {
    if (files.length === 1) {
      if (files[0].size > uploadLimitConverted) {
        setModalText(
          `${files[0].name} exceeds the file size limit of ${uploadLimit}.`
        );
      } else {
        setModalText(`${files[0].name} is not an accepted file type`);
      }
    } else {
      const rejectedMessages = files.reduce(
        (acc, file) => (acc += `${file.name}, `),
        ""
      );
      setModalText(`${rejectedMessages}are not accepted file types`);
    }
  };
  const uploadLimitConverted =
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
    readFile(file).catch((error: DOMException) => {
      setCurrentFile(null);
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
          onDropRejected: handleDropRejected,
          maxSize: uploadLimitConverted,
        }}
      >
        <MultipleFileUploadMain
          titleIcon={<UploadIcon />}
          titleText="Drag and drop files here"
          titleTextSeparator="or"
          infoText="Accepted file types: war, ear, jar or zip"
        />
        {currentFile && (
          <MultipleFileUploadStatusItem
            file={currentFile}
            key={currentFile.name}
            onClearClick={() => {
              removeFile({
                id: taskgroupID,
                path: `binary/${artifact}`,
              });
              setCurrentFile(null);
              setValue("artifact", "");
            }}
            customFileHandler={handleFile}
            progressValue={fileUploadProgress}
            progressVariant={fileUploadStatus}
          />
        )}
        <Modal
          isOpen={!!modalText}
          title="Unsupported file"
          titleIconVariant="warning"
          variant="medium"
          showClose
          aria-label="unsupported file upload attempted"
          onClose={() => setModalText("")}
        >
          {modalText}
        </Modal>
      </MultipleFileUpload>
    </>
  );
};
