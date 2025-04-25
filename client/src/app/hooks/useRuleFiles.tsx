import { useContext, useState } from "react";
import { HubFile, IReadFile, Taskgroup } from "@app/api/models";
import { NotificationsContext } from "@app/components/NotificationsContext";
import { AxiosError, AxiosResponse } from "axios";
import { useUploadFileMutation } from "@app/queries/taskgroups";
import { getAxiosErrorMessage } from "@app/utils/utils";
import { useCreateFileMutation } from "@app/queries/targets";
import { XMLValidator } from "fast-xml-parser";
import XSDSchema from "./windup-jboss-ruleset.xsd";
import { checkRuleFileType } from "../utils/rules-utils";
import { DropEvent } from "@patternfly/react-core";
import { load as loadYaml, YAMLException } from "js-yaml";
import { counting } from "radash";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const xmllint = require("xmllint");

export interface ValidationFunctionResult {
  state: "valid" | "error";
  message?: string;
}

const validateXmlFile = (data: string): ValidationFunctionResult => {
  // Filter out "data:text/xml;base64," from data
  const validationObject = XMLValidator.validate(data, {
    allowBooleanAttributes: true,
  });

  // If xml is valid, check against schema
  if (validationObject === true) {
    const currentSchema = XSDSchema;

    const validationResult = xmllint.xmllint.validateXML({
      xml: data,
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

const validateYamlFile = (data: string): ValidationFunctionResult => {
  try {
    loadYaml(data);
    return {
      state: "valid",
    };
  } catch (err) {
    const yamlException = err as YAMLException;
    return {
      state: "error",
      message: `${yamlException.reason} (ln: ${yamlException.mark.line}, col: ${yamlException.mark.column})`,
    };
  }
};

export interface UseRuleFilesParams {
  ruleFiles: IReadFile[];
  fileExists?: (fileName: string) => boolean;
  onChangeRuleFiles: (ruleFiles: IReadFile[]) => void;
  taskgroupId?: number;
}

export default function useRuleFiles({
  ruleFiles,
  onChangeRuleFiles,
  fileExists,
  taskgroupId,
}: UseRuleFilesParams) {
  const { pushNotification } = useContext(NotificationsContext);
  const [uploadError, setUploadError] = useState("");

  const updateRuleFile = (updatedFile: IReadFile) => {
    const updated = ruleFiles.slice();
    const updateIndex = updated.findIndex(
      ({ fileName }) => fileName === updatedFile.fileName
    );
    updated[updateIndex] = updatedFile;
    onChangeRuleFiles(updated);
  };

  const notifyOnUploadFail = (error: AxiosError) => {
    pushNotification({
      title: getAxiosErrorMessage(error),
      variant: "danger",
    });
  };

  const { mutate: createRuleFile } = useCreateFileMutation(
    (response: HubFile, _formData: FormData, file: IReadFile) => {
      updateRuleFile({
        ...file,
        responseID: response?.id,
      });
    },
    notifyOnUploadFail
  );

  const { mutate: uploadTaskgroupFile } = useUploadFileMutation(
    (
      response: AxiosResponse<Taskgroup>,
      _id: number,
      _path: string,
      _formData: IReadFile,
      file: IReadFile
    ) => {
      updateRuleFile({
        ...file,
        responseID: response?.data?.id,
      });
    },
    notifyOnUploadFail
  );

  const readFile = (file: File) => {
    return new Promise<string>((resolve, reject) => {
      const ruleFile = ruleFiles.find(({ fileName }) => fileName === file.name);

      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.onprogress = (data) => {
        if (ruleFile && data.lengthComputable) {
          updateRuleFile({
            ...ruleFile,
            loadPercentage: (data.loaded / data.total) * 100,
          });
        }
      };
      reader.readAsText(file);
    });
  };

  const handleFileDrop = (_event: DropEvent, droppedFiles: File[]) => {
    // identify what, if any, files are re-uploads of already uploaded files
    const currentFileNames = ruleFiles.map((file) => file.fileName);
    const reUploads = droppedFiles.filter((droppedFile) =>
      currentFileNames.includes(droppedFile.name)
    );

    // this promise chain is needed because if the file removal is done at the same time as the
    // file adding react won't realize that the status items for the re-uploaded files needs to
    // be re-rendered
    Promise.resolve()
      .then(() => removeFiles(reUploads.map((file) => file.name)))
      .then(() => {
        const droppedReadFiles: IReadFile[] = droppedFiles.map(
          (droppedFile) => {
            return {
              fileName: droppedFile.name,
              fullFile: droppedFile,
            };
          }
        );

        const update = [...ruleFiles, ...droppedReadFiles];
        onChangeRuleFiles(update);
      });
  };

  const removeFiles = (namesOfFilesToRemove: string[]) => {
    const updatedRuleFilesList = ruleFiles.filter(
      (file) =>
        !namesOfFilesToRemove.some((fileName) => fileName === file.fileName)
    );

    if (!updatedRuleFilesList.some((file) => file.loadResult === "danger")) {
      setUploadError("");
    }

    onChangeRuleFiles(updatedRuleFilesList);
  };

  const handleFile = (file: File) => {
    // Don't do anything for a File that is just a placeholder for an existing hub file
    if (!file || file.type === "placeholder") {
      return;
    }

    readFile(file)
      .then((fileContents) => {
        let error = undefined;

        // Block duplicate file name uploads if a Taskgroup is available
        if (fileExists && fileExists(file.name)) {
          error = new Error(`File "${file.name}" is already uploaded`);
        }

        // Verify/lint the contents of an XML file
        if (!error && checkRuleFileType(file.name) === "XML") {
          const result = validateXmlFile(fileContents);
          if (result.state === "error") {
            error = new Error(
              `File "${file.name}" is not valid XML: ${result.message}`
            );
          }
        }

        // Verify/lint the contents of a YAML file
        if (!error && checkRuleFileType(file.name) === "YAML") {
          const result = validateYamlFile(fileContents);
          if (result.state === "error") {
            error = new Error(
              `File "${file.name}" is not valid YAML: ${result.message}`
            );
          }
        }

        if (error) {
          handleReadFail(error, 100, file);
        } else {
          handleReadSuccess(fileContents, file);
        }
      })
      .catch((error) => {
        handleReadFail(error, 0, file);
      });
  };

  const handleReadSuccess = (data: string, file: File) => {
    const newFile: IReadFile = {
      data,
      fileName: file.name,
      loadResult: "success",
      loadPercentage: 100,
      fullFile: file,
    };

    const formFile = new FormData();
    newFile.fullFile && formFile.append("file", newFile.fullFile);

    if (taskgroupId) {
      uploadTaskgroupFile({
        id: taskgroupId,
        path: `rules/${newFile.fileName}`,
        formData: formFile,
        file: newFile,
      });
    } else {
      createRuleFile({
        formData: formFile,
        file: newFile,
      });
    }

    // Note: The ruleFile will be updated by the onSuccess handlers of the mutations
  };

  const handleReadFail = (error: Error, percentage: number, file: File) => {
    setUploadError(error.message);
    const fileWithErrorState: IReadFile = {
      loadError: error,
      fileName: file.name,
      loadResult: "danger",
      loadPercentage: percentage,
      fullFile: file,
    };
    updateRuleFile(fileWithErrorState);
  };

  const results = counting(ruleFiles, (r) => r.loadResult ?? "inProgress");

  const ruleFilesStatusText = `${results.success} of ${ruleFiles.length} files uploaded`;
  const ruleFilesStatusIcon =
    results.inProgress > 0
      ? "inProgress"
      : results.danger > 0
      ? "danger"
      : "success";

  return {
    /** Manage the set of files when a new file is dropped or uploaded. */
    handleFileDrop,
    handleFile,
    removeFiles,

    uploadError,
    clearUploadError: () => setUploadError(""),

    ruleFilesStatusText,
    ruleFilesStatusIcon,
  };
}
