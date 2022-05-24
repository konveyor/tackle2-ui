import * as React from "react";
import {
  Alert,
  Modal,
  MultipleFileUpload,
  MultipleFileUploadMain,
  MultipleFileUploadStatus,
  MultipleFileUploadStatusItem,
} from "@patternfly/react-core";
import UploadIcon from "@patternfly/react-icons/dist/esm/icons/upload-icon";
import { useFormContext } from "react-hook-form";
import { XMLValidator } from "fast-xml-parser";

import XSDSchema from "./windup-jboss-ruleset.xsd";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";

const xmllint = require("xmllint");

export interface IReadFile {
  fileName: string;
  data?: string;
  loadResult?: "danger" | "success";
  loadError?: DOMException;
  file: File;
}

export const AddCustomRules: React.FunctionComponent = () => {
  const { getValues, setValue } = useFormContext();
  const { customRulesFiles } = getValues();
  const [modalText, setModalText] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  const statusIcon = () => {
    if (isLoading) {
      return "inProgress";
    } else if (
      customRulesFiles.every((file) => file.loadResult === "success")
    ) {
      return "success";
    } else {
      return "danger";
    }
  };

  // remove files from both state arrays based on their name
  const removeFiles = (namesOfFilesToRemove: string[]) => {
    // const newCurrentFiles = currentFiles.filter(
    //   (currentFile) =>
    //     !namesOfFilesToRemove.some((fileName) => fileName === currentFile.name)
    // );
    // setCurrentFiles(newCurrentFiles);
    const newReadFiles = customRulesFiles.filter(
      (readFile) =>
        !namesOfFilesToRemove.some((fileName) => fileName === readFile.fileName)
    );
    setValue("customRulesFiles", newReadFiles);
  };

  const validateXMLFile = (data: string) => {
    const validationObject = XMLValidator.validate(data, {
      allowBooleanAttributes: true,
    });
    //if xml is valid, check against schema
    if (validationObject === true) {
      const currentSchema = XSDSchema;

      const validationResult = xmllint.xmllint.validateXML({
        xml: data,
        schema: currentSchema,
      });

      if (!validationResult.errors) {
        //valid against  schema
        return true;
      } else {
        //not valid against  schema
        setError(validationResult?.errors?.toString());
        return false;
      }
    } else {
      setError(validationObject?.err?.msg?.toString());
      return false;
    }
  };
  const hasDuplicateFile = (name: string) =>
    customRulesFiles.some((file) => file.name === name);

  // const readText = async (file: File) => {
  //   return await file.text();
  // };
  const handleFileDrop = async function (droppedFiles: File[]) {
    const reader = new FileReader();
    let currFiles: IReadFile[] = [];
    for (const file of droppedFiles) {
      // const value = reader.readAsText(file);
      const text = await file.text();
      const isXMLFileValid = validateXMLFile(text);
      const isUniqueFile = !hasDuplicateFile(file.name);
      if (!isXMLFileValid) {
        return;
        // throw "error";
      } else if (!isUniqueFile) {
        setError(
          "A custom rule file with that name has already been uploaded."
        );
      } else {
        const newReadFile: IReadFile = {
          fileName: file.name,
          loadResult: "success",
          file: file,
        };
        currFiles.push(newReadFile);
      }
    }
    // const fileList: IReadFile[] = [...customRulesFiles, newReadFile];

    // setValue("customRulesFiles", fileList);
    setValue("customRulesFiles", currFiles);
    // const currentFileNames = currentFiles.map((file) => file.name);
    // const reUploads = droppedFiles.filter((droppedFile) =>
    //   currentFileNames.includes(droppedFile.name)
    // );
    // Promise.resolve()
    //   .then(() => removeFiles(reUploads.map((file) => file.name)))
    //   .then(() =>
    //     setCurrentFiles((prevFiles: File[]) => [...prevFiles, ...droppedFiles])
    //   );
  };

  const handleReadSuccess = (data: string, file: File) => {
    // const isXMLFileValid = validateXMLFile(data);
    // const isUniqueFile = !hasDuplicateFile(file.name);
    // if (!isXMLFileValid) {
    //   return;
    //   // throw "error";
    // } else if (!isUniqueFile) {
    //   setError("A custom rule file with that name has already been uploaded.");
    // } else {
    //   const newReadFile: IReadFile = {
    //     data,
    //     fileName: file.name,
    //     loadResult: "success",
    //     file: file,
    //   };
    //   const fileList: IReadFile[] = [...customRulesFiles, newReadFile];
    //   setValue("customRulesFiles", fileList);
    // }
  };

  const handleReadFail = (error: DOMException, file: File) => {
    const fileList = [
      ...customRulesFiles,
      {
        loadError: error,
        fileName: file.name,
        loadResult: "danger",
      } as IReadFile,
    ];

    setValue("customRulesFiles", fileList);
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

  const successfullyReadFileCount = customRulesFiles.filter(
    (fileData) => fileData.loadResult === "success"
  ).length;

  return (
    <>
      {error && (
        <Alert
          className={`${spacing.mtMd} ${spacing.mbMd}`}
          variant="danger"
          isInline
          title={error}
        />
      )}
      <MultipleFileUpload
        onFileDrop={handleFileDrop}
        dropzoneProps={{
          accept: ".windup.xml",
          onDropRejected: handleDropRejected,

          // onDrop:
        }}
      >
        <MultipleFileUploadMain
          titleIcon={<UploadIcon />}
          titleText="Drag and drop files here"
          titleTextSeparator="or"
          infoText="Accepted file types: XML with '.windup.xml' suffix."
        />
        {customRulesFiles.length && (
          <MultipleFileUploadStatus
            statusToggleText={`${successfullyReadFileCount} of ${customRulesFiles.length} files uploaded`}
            statusToggleIcon={statusIcon}
          >
            {customRulesFiles.map((file) => (
              <MultipleFileUploadStatusItem
                file={file}
                key={file.name}
                onClearClick={() => removeFiles([file.name])}
                onReadSuccess={handleReadSuccess}
                onReadFail={handleReadFail}
                onReadStarted={() => setIsLoading(true)}
                onReadFinished={() => setIsLoading(false)}
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
    </>
  );
};
