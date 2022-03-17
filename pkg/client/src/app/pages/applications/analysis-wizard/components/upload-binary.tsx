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

export interface IReadFile {
  fileName: string;
  data?: string;
  loadResult?: "danger" | "success";
  loadError?: DOMException;
}

interface IUploadBinary {}

export const UploadBinary: React.FunctionComponent<IUploadBinary> = () => {
  const [readFileData, setReadFileData] = React.useState<IReadFile[]>([]);
  const [currentFiles, setCurrentFiles] = React.useState<File[]>([]);
  const [showStatus, setShowStatus] = React.useState(false);
  const [modalText, setModalText] = React.useState("");

  if (!showStatus && readFileData) {
    setShowStatus(true);
  }

  const removeFiles = (namesOfFilesToRemove: string[]) => {
    const newCurrentFiles = currentFiles.filter(
      (currentFile) =>
        !namesOfFilesToRemove.some((fileName) => fileName === currentFile.name)
    );

    setCurrentFiles(newCurrentFiles);

    const newReadFiles = readFileData.filter(
      (readFile) =>
        !namesOfFilesToRemove.some((fileName) => fileName === readFile.fileName)
    );

    setReadFileData(newReadFiles);
  };

  const handleFileDrop = (droppedFiles: File[]) => {
    const currentFileNames = currentFiles.map((file) => file.name);
    const reUploads = droppedFiles.filter((droppedFile) =>
      currentFileNames.includes(droppedFile.name)
    );

    Promise.resolve()
      .then(() => removeFiles(reUploads.map((file) => file.name)))
      .then(() =>
        setCurrentFiles((prevFiles: File[]) => [...prevFiles, ...droppedFiles])
      );
  };

  const handleReadSuccess = (data: string, file: File) => {
    const newReadFile: IReadFile = {
      data,
      fileName: file.name,
      loadResult: "success",
    };

    const fileList = [newReadFile];

    setCurrentFiles(
      currentFiles.filter((file) => file.name === fileList[0].fileName)
    );
    setReadFileData(fileList);
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
      {showStatus && currentFiles.length > 0 && (
        <MultipleFileUploadStatusItem
          file={currentFiles[0]}
          key={currentFiles[0].name}
          onClearClick={() => removeFiles([currentFiles[0].name])}
          onReadSuccess={handleReadSuccess}
          onReadFail={handleReadFail}
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
