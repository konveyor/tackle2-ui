import * as React from "react";
import {
  Modal,
  MultipleFileUpload,
  MultipleFileUploadButton,
  MultipleFileUploadInfo,
  MultipleFileUploadMain,
  MultipleFileUploadStatusItem,
  MultipleFileUploadTitle,
  MultipleFileUploadTitleIcon,
  MultipleFileUploadTitleText,
  MultipleFileUploadTitleTextSeparator,
} from "@patternfly/react-core";
import { useFormContext } from "react-hook-form";
import { useUploadFileMutation } from "@app/queries/tasks";
import { IAnalysisWizardFormValues, IReadFile } from "../analysis-wizard";
import { Task } from "@app/api/models";

interface IUploadBinary {
  createdTaskID: number;
}

export const UploadBinary: React.FunctionComponent<IUploadBinary> = ({
  createdTaskID,
}) => {
  const [readFileData, setReadFileData] = React.useState<IReadFile[]>([]);
  const [currentFile, setCurrentFile] = React.useState<File>();
  const [showStatus, setShowStatus] = React.useState(false);
  const [modalText, setModalText] = React.useState("");
  const [fileUploadProgress, setFileUploadProgress] = React.useState<
    number | undefined
  >(undefined);
  const [fileUploadStatus, setFileUploadStatus] = React.useState<
    "danger" | "success" | "warning" | undefined
  >(undefined);

  React.useEffect(() => {
    return () => {
      setFileUploadProgress(undefined);
      setFileUploadStatus(undefined);
    };
  }, []);

  const completedUpload = (response: any) => {
    setFileUploadStatus("success");
    setFileUploadProgress(100);
  };

  const failedUpload = (response: any) => {
    setFileUploadStatus("danger");
    setFileUploadProgress(0);
  };

  const {
    mutate: uploadFile,
    isLoading: isFileUploadLoading,
    error,
  } = useUploadFileMutation(completedUpload, failedUpload);

  const { register, getValues, setValue } =
    useFormContext<IAnalysisWizardFormValues>();

  if (!showStatus && readFileData) {
    setShowStatus(true);
  }

  const removeFiles = (nameOfFileToRemove: string) => {
    if (currentFile && currentFile.name === nameOfFileToRemove)
      setCurrentFile(undefined);

    const newReadFiles = readFileData.filter(
      (readFile) => readFile.fileName !== nameOfFileToRemove
    );

    setReadFileData(newReadFiles);
  };

  const handleFileDrop = (droppedFiles: File[]) => {
    Promise.resolve()
      .then(() => removeFiles(droppedFiles[0].name))
      .then(() => setCurrentFile(droppedFiles[0]));
  };

  const handleReadSuccess = (data: string, file: File) => {
    const newReadFile: IReadFile = {
      data,
      fileName: file.name,
      loadResult: "success",
    };

    setReadFileData([newReadFile]);
  };

  const handleReadFail = (error: DOMException, file: File) => {
    const fileList = [
      ...readFileData,
      {
        loadError: error,
        fileName: file.name,
        loadResult: "danger",
      } as IReadFile,
    ];

    setReadFileData(fileList);
  };

  const handleDropRejected = (
    files: File[],
    _event: React.DragEvent<HTMLElement>
  ) => {
    if (files.length === 1) {
      setModalText(`${files[0].name} is not an accepted file type`);
    } else {
      const rejectedMessages = files.reduce(
        (acc, file) => (acc += `${file.name}, `),
        ""
      );
      setModalText(`${rejectedMessages}are not accepted file types`);
    }
  };

  return (
    <MultipleFileUpload
      onFileDrop={handleFileDrop}
      dropzoneProps={{
        accept: ".war, .ear, .jar, .zip",
        onDropRejected: handleDropRejected,
      }}
    >
      <MultipleFileUploadMain>
        <MultipleFileUploadTitle>
          <MultipleFileUploadTitleIcon />
          <MultipleFileUploadTitleText>
            Drag and drop file here
            <MultipleFileUploadTitleTextSeparator>
              or
            </MultipleFileUploadTitleTextSeparator>
          </MultipleFileUploadTitleText>
        </MultipleFileUploadTitle>
        <MultipleFileUploadButton />
        <MultipleFileUploadInfo>
          Accepted file: war, ear, jar or zip.
        </MultipleFileUploadInfo>
      </MultipleFileUploadMain>
      {showStatus && currentFile && (
        <MultipleFileUploadStatusItem
          file={currentFile}
          key={currentFile.name}
          onClearClick={() => removeFiles(currentFile.name)}
          onReadSuccess={handleReadSuccess}
          onReadFail={handleReadFail}
          customFileHandler={(file) => {
            var form = new FormData();
            form.append("file", file);
            //TODO: Find correct task to associate with bucket
            let currentTaskID = createdTaskID || null;
            uploadFile({
              id: currentTaskID,
              path: "file-upload",
              file: form,
            });
          }}
          progressValue={fileUploadProgress}
          progressVariant={fileUploadStatus}
        />
      )}
      <Modal
        isOpen={!!modalText}
        title="Unsupported file"
        titleIconVariant="warning"
        showClose
        aria-label="unsupported file upload attempted"
        onClose={() => setModalText("")}
      >
        {modalText}
      </Modal>
    </MultipleFileUpload>
  );
};
