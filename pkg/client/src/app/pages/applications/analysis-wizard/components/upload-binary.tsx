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
import { useDispatch } from "react-redux";

import { alertActions } from "@app/store/alert";
import {
  useRemoveUploadedFileMutation,
  useUploadFileTaskgroupMutation,
} from "@app/queries/taskgroups";
import { AxiosError } from "axios";
import { getAxiosErrorMessage } from "@app/utils/utils";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";
import { uploadLimit } from "@app/Constants";

interface IUploadBinary {
  taskgroupID: number;
}

export const UploadBinary: React.FunctionComponent<IUploadBinary> = ({
  taskgroupID,
}) => {
  const { setValue, getValues } = useFormContext();
  const { artifact } = getValues();
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

  const dispatch = useDispatch();

  const completedUpload = () => {
    dispatch(alertActions.addInfo(`Success`, "Uploaded binary file."));
    setFileUploadStatus("success");
    setFileUploadProgress(100);
  };

  const failedUpload = (error: AxiosError) => {
    dispatch(alertActions.addDanger(`Failed`, "Binary file upload failed."));
    setFileUploadStatus("danger");
    setFileUploadProgress(0);
    setError(error);
  };

  const completedRemove = () => {
    dispatch(alertActions.addInfo(`Success`, "Removed binary file."));
    setFileUploadStatus("success");
    setFileUploadProgress(100);
  };

  const failedRemove = (error: AxiosError) => {
    dispatch(alertActions.addDanger(`Failed`, "Binary file removal failed."));
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
