import * as React from "react";
import {
  Alert,
  AlertActionCloseButton,
  Modal,
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
import { useFormContext } from "react-hook-form";

const xmllint = require("xmllint");
interface IAddCustomRulesProps {
  currentFiles: IReadFile[];
  setCurrentFiles: (files: IReadFile[]) => void;
}

export const AddCustomRules: React.FunctionComponent<IAddCustomRulesProps> = ({
  currentFiles,
  setCurrentFiles,
}) => {
  const { getValues, setValue } = useFormContext();
  const customRulesFiles: IReadFile[] = getValues("customRulesFiles");
  const [modalText, setModalText] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  const getStatusIcon = () => {
    if (isLoading) {
      return "inProgress";
    } else if (currentFiles.every((file) => file.loadResult === "success")) {
      return "success";
    } else {
      return "danger";
    }
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
    currentFiles.some((file) => file.fileName === name) ||
    customRulesFiles.some((file) => file.fileName === name);

  const handleFileDrop = async function (droppedFiles: File[]) {
    let currFiles: IReadFile[] = [];
    for (const file of droppedFiles) {
      //TODO: validate files
      // const text = await file.text();
      // const isXMLFileValid = validateXMLFile(text);
      const isXMLFileValid = true;
      //

      const isUniqueFile = !hasDuplicateFile(file.name);
      if (!isXMLFileValid) {
        return;
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

    const fileList: IReadFile[] = [...currentFiles, ...currFiles];

    setCurrentFiles(fileList);
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

  const successfullyReadFileCount = currentFiles.filter(
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
          actionClose={<AlertActionCloseButton onClose={() => setError("")} />}
        />
      )}
      <MultipleFileUpload
        onFileDrop={handleFileDrop}
        dropzoneProps={{
          accept: ".windup.xml",
          onDropRejected: handleDropRejected,
        }}
      >
        <MultipleFileUploadMain
          titleIcon={<UploadIcon />}
          titleText="Drag and drop files here"
          titleTextSeparator="or"
          infoText="Accepted file types: XML with '.windup.xml' suffix."
        />
        {!!currentFiles.length && (
          <MultipleFileUploadStatus
            statusToggleText={`${successfullyReadFileCount} of ${currentFiles.length} files uploaded`}
            statusToggleIcon={getStatusIcon()}
          >
            {currentFiles.map((file, i) => (
              <MultipleFileUploadStatusItem
                file={file.file}
                key={file.fileName}
                onClearClick={() => setCurrentFiles(currentFiles.splice(i, 1))}
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
          variant="medium"
          aria-label="unsupported file upload attempted"
          onClose={() => setModalText("")}
        >
          {modalText}
        </Modal>
      </MultipleFileUpload>
    </>
  );
};
