import * as React from "react";
import {
  Alert,
  AlertActionCloseButton,
  MultipleFileUpload,
  MultipleFileUploadMain,
  MultipleFileUploadStatus,
  MultipleFileUploadStatusItem,
} from "@patternfly/react-core";
import UploadIcon from "@patternfly/react-icons/dist/esm/icons/upload-icon";
import { XMLValidator } from "fast-xml-parser";

import XSDSchema from "./windup-jboss-ruleset.xsd";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";
import { IReadFile } from "../analysis-wizard";

const xmllint = require("xmllint");
interface IAddCustomRules {
  customRulesFiles: IReadFile[];
  readFileData: IReadFile[];
  setReadFileData: (setReadFile: React.SetStateAction<IReadFile[]>) => void;
}
interface IParsedXMLFileStatus {
  state: "valid" | "error";
  message?: string;
}

export const AddCustomRules: React.FunctionComponent<IAddCustomRules> = ({
  customRulesFiles,
  readFileData,
  setReadFileData,
}: IAddCustomRules) => {
  const [error, setError] = React.useState("");
  const [currentFiles, setCurrentFiles] = React.useState<File[]>([]);
  const [showStatus, setShowStatus] = React.useState(false);

  // only show the status component once a file has been uploaded, but keep the status list component itself even if all files are removed
  if (!showStatus && currentFiles.length > 0) {
    setShowStatus(true);
  }

  // determine the icon that should be shown for the overall status list
  const setStatus = () => {
    if (readFileData.length < currentFiles.length) {
      return "inProgress";
    } else if (readFileData.every((file) => file.loadResult === "success")) {
      return "success";
    } else {
      return "danger";
    }
  };

  const validateXMLFile = (data: string): IParsedXMLFileStatus => {
    // Filter out "data:text/xml;base64," from data
    const payload = atob(data.substring(21));
    const validationObject = XMLValidator.validate(payload, {
      allowBooleanAttributes: true,
    });

    // If xml is valid, check against schema
    if (validationObject === true) {
      const currentSchema = XSDSchema;

      const validationResult = xmllint.xmllint.validateXML({
        xml: payload,
        schema: currentSchema,
      });

      if (validationResult.errors)
        return {
          state: "error",
          message: validationResult?.errors?.toString(),
        };
      else return { state: "valid" };
    } else
      return {
        state: "error",
        message: validationObject?.err?.msg?.toString(),
      };
  };

  // callback that will be called by the react dropzone with the newly dropped file objects
  const handleFileDrop = (droppedFiles: File[]) => {
    // identify what, if any, files are re-uploads of already uploaded files
    const currentFileNames = currentFiles.map((file) => file.name);
    const reUploads = droppedFiles.filter((droppedFile) =>
      currentFileNames.includes(droppedFile.name)
    );

    /** this promise chain is needed because if the file removal is done at the same time as the file adding react
     * won't realize that the status items for the re-uploaded files needs to be re-rendered */
    Promise.resolve()
      .then(() => removeFiles(reUploads.map((file) => file.name)))
      .then(() =>
        setCurrentFiles((prevFiles) => [...prevFiles, ...droppedFiles])
      );
  };

  const readFile = (file: File) => {
    return new Promise<string | null>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.onprogress = (data) => {
        if (data.lengthComputable) {
          // setLoadPercentage((data.loaded / data.total) * 100);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const isFileIncluded = (name: string) =>
    customRulesFiles.some((file) => file.fileName === name);

  const handleFile = (file: File) => {
    readFile(file)
      .then((data) => {
        if (isFileIncluded(file.name)) {
          const error = new DOMException(
            `File "${file.name}" is already uploaded`
          );
          handleReadFail(error, 100, file);
        } else {
          if (data) {
            const validatedXMLResult = validateXMLFile(data);
            if (validatedXMLResult.state === "valid")
              handleReadSuccess(data, file);
            else {
              const error = new DOMException(
                `File "${file.name}" is not a valid XML: ${validatedXMLResult.message}`
              );
              handleReadFail(error, 100, file);
            }
          }
        }
      })
      .catch((error: DOMException) => {
        handleReadFail(error, 0, file);
      });
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

    setReadFileData(newReadFiles);
  };

  const handleReadSuccess = (data: string, file: File) => {
    const newFile: IReadFile = {
      data,
      fileName: file.name,
      loadResult: "success",
      loadPercentage: 100,
      fullFile: file,
    };
    setReadFileData((prevReadFiles) => [...prevReadFiles, newFile]);
  };

  const handleReadFail = (
    error: DOMException,
    percentage: number,
    file: File
  ) => {
    setError(error.toString());
    setReadFileData((prevReadFiles) => [
      ...prevReadFiles,
      {
        loadError: error,
        fileName: file.name,
        loadResult: "danger",
        loadPercentage: percentage,
        fullFile: file,
      },
    ]);
  };

  const successfullyReadFileCount = readFileData.filter(
    (fileData) => fileData.loadResult === "success"
  ).length;

  const getloadPercentage = (filename: string) => {
    const readFile = readFileData.find((file) => file.fileName === filename);
    if (readFile) return readFile.loadPercentage;
    return 0;
  };

  const getloadResult = (filename: string) => {
    const readFile = readFileData.find((file) => file.fileName === filename);
    if (readFile) return readFile.loadResult;
    return undefined;
  };

  return (
    <>
      {error !== "" && (
        <Alert
          className={`${spacing.mtMd} ${spacing.mbMd}`}
          variant="danger"
          isInline
          title={error}
          actionClose={<AlertActionCloseButton onClose={() => setError("")} />}
        />
      )}
      <MultipleFileUpload
        onFileDrop={handleFileDrop}
        dropzoneProps={{
          accept: ".windup.xml",
        }}
      >
        <MultipleFileUploadMain
          titleIcon={<UploadIcon />}
          titleText="Drag and drop files here"
          titleTextSeparator="or"
          infoText="Accepted file types: XML with '.windup.xml' suffix."
        />
        {showStatus && (
          <MultipleFileUploadStatus
            statusToggleText={`${successfullyReadFileCount} of ${currentFiles.length} files uploaded`}
            statusToggleIcon={setStatus()}
          >
            {currentFiles.map((file) => (
              <MultipleFileUploadStatusItem
                file={file}
                key={file.name}
                customFileHandler={handleFile}
                onClearClick={() => removeFiles([file.name])}
                progressValue={getloadPercentage(file.name)}
                progressVariant={getloadResult(file.name)}
              />
            ))}
          </MultipleFileUploadStatus>
        )}
      </MultipleFileUpload>
    </>
  );
};
