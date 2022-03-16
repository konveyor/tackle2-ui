import * as React from "react";
import {
  Modal,
  MultipleFileUpload,
  MultipleFileUploadButton,
  MultipleFileUploadInfo,
  MultipleFileUploadMain,
  MultipleFileUploadStatus,
  MultipleFileUploadStatusItem,
  MultipleFileUploadTitle,
  MultipleFileUploadTitleIcon,
  MultipleFileUploadTitleText,
  MultipleFileUploadTitleTextSeparator,
} from "@patternfly/react-core";
import { useFormContext } from "react-hook-form";

import InProgressIcon from "@patternfly/react-icons/dist/esm/icons/in-progress-icon";
import CheckCircleIcon from "@patternfly/react-icons/dist/esm/icons/check-circle-icon";
import TimesCircleIcon from "@patternfly/react-icons/dist/esm/icons/times-circle-icon";
import { XMLValidator } from "fast-xml-parser";

import XSDSchema from "./windup-jboss-ruleset.xsd";

const xmllint = require("xmllint");

export interface IReadFile {
  fileName: string;
  data?: string;
  loadResult?: "danger" | "success";
  loadError?: DOMException;
}

export const AddCustomRules: React.FunctionComponent = () => {
  const { getValues, setValue } = useFormContext();
  const readFileData: IReadFile[] = getValues("customRulesFiles");

  const [currentFiles, setCurrentFiles] = React.useState<File[]>([]);
  const [showStatus, setShowStatus] = React.useState(false);
  const [modalText, setModalText] = React.useState("");

  // only show the status component once a file has been uploaded, but keep the status list component itself even if all files are removed
  if (!showStatus && currentFiles.length > 0) {
    setShowStatus(true);
  }

  // determine the icon that should be shown for the overall status list
  const getStatusIcon = () => {
    if (readFileData.length < currentFiles.length) {
      return <InProgressIcon />;
    }

    if (readFileData.every((file) => file.loadResult === "success")) {
      return <CheckCircleIcon />;
    }

    return <TimesCircleIcon />;
  };

  // remove files from both state arrays based on their name
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

    setValue("customRulesFiles", newReadFiles);
  };

  const isSchemaValid = (value: string) => {
    const validationResult = xmllint.xmllint.validateXML({
      xml: value,
      schema: XSDSchema,
    });

    if (!validationResult.errors) return true;
    return false;
  };

  const validateXMLFile = (data: string) => {
    // Filter out "data:text/xml;base64," from data
    const payload = atob(data.substring(21));

    let isXML = false;
    let isXSD = false;

    const validationObject = XMLValidator.validate(payload, {
      allowBooleanAttributes: true,
    });

    if (validationObject === true) {
      isXML = true;
      if (isSchemaValid(payload)) {
        isXSD = true;
      }
    }
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
    validateXMLFile(data);

    const newReadFile: IReadFile = {
      data,
      fileName: file.name,
      loadResult: "success",
    };
    const fileList = [...readFileData, newReadFile];

    setValue("customRulesFiles", fileList);
  };

  // callback called by the status item when a file encounters an error while being read with the built-in file reader
  const handleReadFail = (error: DOMException, file: File) => {
    const fileList = [
      ...readFileData,
      {
        loadError: error,
        fileName: file.name,
        loadResult: "danger",
      } as IReadFile,
    ];

    setValue("customRulesFiles", fileList);
  };

  // dropzone prop that communicates to the user that files they've attempted to upload are not an appropriate type
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

  const successfullyReadFileCount = readFileData.filter(
    (fileData) => fileData.loadResult === "success"
  ).length;

  return (
    <MultipleFileUpload
      onFileDrop={handleFileDrop}
      dropzoneProps={{
        accept: ".windup.xml",
        onDropRejected: handleDropRejected,
      }}
    >
      <MultipleFileUploadMain>
        <MultipleFileUploadTitle>
          <MultipleFileUploadTitleIcon />
          <MultipleFileUploadTitleText>
            Drag and drop files here
            <MultipleFileUploadTitleTextSeparator>
              or
            </MultipleFileUploadTitleTextSeparator>
          </MultipleFileUploadTitleText>
        </MultipleFileUploadTitle>
        <MultipleFileUploadButton />
        <MultipleFileUploadInfo>
          Accepted files: XML with '.windup.xml' suffix.
        </MultipleFileUploadInfo>
      </MultipleFileUploadMain>
      {showStatus && (
        <MultipleFileUploadStatus
          statusToggleText={`${successfullyReadFileCount} of ${currentFiles.length} files uploaded`}
          statusToggleIcon={getStatusIcon()}
        >
          {currentFiles.map((file) => (
            <MultipleFileUploadStatusItem
              file={file}
              key={file.name}
              onClearClick={() => removeFiles([file.name])}
              onReadSuccess={handleReadSuccess}
              onReadFail={handleReadFail}
            />
          ))}
        </MultipleFileUploadStatus>
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
