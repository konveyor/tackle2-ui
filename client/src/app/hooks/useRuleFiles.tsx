import { useContext, useReducer } from "react";
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

// eslint-disable-next-line unused-imports/no-unused-imports, @typescript-eslint/no-unused-vars
import type { MultipleFileUploadStatusProps } from "@patternfly/react-core";

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
  onAddRuleFiles: (ruleFile: IReadFile[]) => void;
  onRemoveRuleFiles: (ruleFile: IReadFile[]) => void;
  onChangeRuleFile: (ruleFile: IReadFile) => void;
  fileExists?: (fileName: string) => boolean;
  taskgroupId?: number;
}

// function fileSetReducer(state, action: { type: string, payload: unknown }): Record<string, IReadFile> {
//   const actions = {
//     startFile(payload) {

//     },

//     removeFile(payload) {

//     },

//     fileLoaded(payload) {

//     },
//   };

//   return actions[action.type]?.(action);
// }

export default function useRuleFiles({
  ruleFiles,
  onAddRuleFiles,
  onRemoveRuleFiles,
  onChangeRuleFile,
  fileExists,
  taskgroupId,
}: UseRuleFilesParams) {
  const { pushNotification } = useContext(NotificationsContext);
  const [state, dispatch] = useReducer(fileSetReducer, {});

  const notifyOnUploadFail = (error: AxiosError) => {
    pushNotification({
      title: getAxiosErrorMessage(error),
      variant: "danger",
    });
  };

  const { mutate: createRuleFile } = useCreateFileMutation(
    (response: HubFile, _formData: FormData, file: IReadFile) => {
      onChangeRuleFile({
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
      onChangeRuleFile({
        ...file,
        responseID: response?.data?.id,
      });
    },
    notifyOnUploadFail
  );

  const readFile = (ruleFile: IReadFile, file: File) => {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.onprogress = (data) => {
        if (data.lengthComputable) {
          onChangeRuleFile({
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
    const droppedFileNames = droppedFiles.map(({ name }) => name);
    const ruleFilesToRemove = ruleFiles.filter(({ fileName }) =>
      droppedFileNames.includes(fileName)
    );

    // this promise chain is needed because if the file removal is done at the same time as the
    // file adding react won't realize that the status items for the re-uploaded files needs to
    // be re-rendered
    Promise.resolve()
      .then(() => onRemoveRuleFiles(ruleFilesToRemove))
      .then(() => {
        const newRuleFiles: IReadFile[] = droppedFiles.map((droppedFile) => ({
          fileName: droppedFile.name,
          fullFile: droppedFile,
        }));
        onAddRuleFiles(newRuleFiles);
      });
  };

  const handleFile = (ruleFile: IReadFile, file: File) => {
    // Don't do anything for a File that already loaded or is just a
    // placeholder for an existing hub file
    if (
      ruleFile.loadResult === "success" ||
      ruleFile.loadPercentage === 100 ||
      file.type === "placeholder"
    ) {
      return;
    }

    readFile(ruleFile, file)
      .then(async (fileContents) => {
        console.log("successfully read", file.name);
        ruleFile.loadPercentage = 100;

        // Block duplicate file name uploads if a Taskgroup is available
        if (fileExists && fileExists(file.name)) {
          throw new Error(`File "${file.name}" is already uploaded`);
        }

        // Verify/lint the contents of an XML file
        if (checkRuleFileType(file.name) === "XML") {
          const result = validateXmlFile(fileContents);
          if (result.state === "error") {
            throw new Error(
              `File "${file.name}" is not valid XML: ${result.message}`
            );
          }
        }

        // Verify/lint the contents of a YAML file
        if (checkRuleFileType(file.name) === "YAML") {
          const result = validateYamlFile(fileContents);
          if (result.state === "error") {
            throw new Error(
              `File "${file.name}" is not valid YAML: ${result.message}`
            );
          }
        }

        handleReadSuccess(ruleFile, file, fileContents);
      })
      .catch((error) => {
        handleReadFail(ruleFile, file, error);
      });
  };

  const handleReadSuccess = (ruleFile: IReadFile, file: File, data: string) => {
    console.log("reading SUCCESS", file.name);
    const newFile: IReadFile = {
      ...ruleFile,
      data,
      fullFile: file,
      loadResult: "success",
      loadPercentage: 100,
    };

    const formFile = new FormData();
    formFile.append("file", file);

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

  const handleReadFail = (ruleFile: IReadFile, file: File, error: Error) => {
    console.log("reading FAIL", file.name, ", Error: ", error.message);
    const fileWithErrorState: IReadFile = {
      ...ruleFile,
      fullFile: file,
      loadResult: "danger",
      loadError: error,
    };
    onChangeRuleFile(fileWithErrorState);
  };

  return {
    /** Manage the set of files when a new file is dropped or uploaded. */
    handleFileDrop,
    handleFile,
  };
}
