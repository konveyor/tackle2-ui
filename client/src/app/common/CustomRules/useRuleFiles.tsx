import { useContext, useState } from "react";
import XSDSchema from "./windup-jboss-ruleset.xsd";
import { XMLValidator } from "fast-xml-parser";
import { FileLoadError, IReadFile } from "@app/api/models";
import { NotificationsContext } from "@app/shared/notifications-context";
import { AxiosError } from "axios";
import { useUploadFileMutation } from "@app/queries/taskgroups";
import { getAxiosErrorMessage } from "@app/utils/utils";
import { useCreateFileMutation } from "@app/queries/rulebundles";
import { CustomTargetFormValues } from "@app/pages/migration-targets/custom-target-form";
import { UseFormReturn } from "react-hook-form";
const xmllint = require("xmllint");

export default function useRuleFiles(
  taskgroupID: number | null | undefined,
  existingRuleFiles: IReadFile[] = [],
  methods?: UseFormReturn<CustomTargetFormValues>
) {
  const { pushNotification } = useContext(NotificationsContext);
  const [uploadError, setUploadError] = useState("");
  const [ruleFiles, setRuleFiles] = useState<IReadFile[]>(existingRuleFiles);
  const [showStatus, setShowStatus] = useState(true);

  const onUploadError = (error: AxiosError) =>
    console.log("File upload failed: ", error);

  const onCreateRuleFileSuccess = (
    response: any,
    formData: FormData,
    file: IReadFile
  ) => {
    setRuleFiles((oldRuleFiles) => {
      const fileWithID: IReadFile = {
        ...file,
        ...{ responseID: response?.id },
      };
      const updatedFiles = [...oldRuleFiles];
      const ruleFileToUpdate = ruleFiles.findIndex(
        (ruleFile) => ruleFile.fileName === file.fileName
      );
      updatedFiles[ruleFileToUpdate] = fileWithID;

      if (methods) {
        methods.setValue(
          "customRulesFiles",
          updatedFiles.filter((ruleFile) => ruleFile.loadResult === "success"),
          { shouldDirty: true, shouldValidate: true }
        );
      }
      return updatedFiles;
    });
  };

  const onCreateRuleFileFailure = (error: AxiosError) => {
    pushNotification({
      title: getAxiosErrorMessage(error),
      variant: "danger",
    });
  };

  const { mutate: createRuleFile } = useCreateFileMutation(
    onCreateRuleFileSuccess,
    onCreateRuleFileFailure
  );

  const onUploadFileSuccess = (
    response: any,
    id: number,
    path: string,
    formData: IReadFile,
    file: IReadFile
  ) => {
    //Set file ID for use in form submit
    setRuleFiles((oldRuleFiles) => {
      const fileWithID: IReadFile = {
        ...file,
        ...{ responseID: response?.id },
      };
      const updatedFiles = [...oldRuleFiles];
      const ruleFileToUpdate = ruleFiles.findIndex(
        (ruleFile) => ruleFile.fileName === file.fileName
      );
      updatedFiles[ruleFileToUpdate] = fileWithID;

      return updatedFiles;
    });
  };

  const { mutate: uploadFile } = useUploadFileMutation(
    onUploadFileSuccess,
    onUploadError
  );

  const setStatus = () => {
    if (ruleFiles.length < existingRuleFiles.length) {
      return "inProgress";
    } else if (ruleFiles.every((file) => file.loadResult === "success")) {
      return "success";
    } else {
      return "danger";
    }
  };

  const isFileIncluded = (name: string) =>
    existingRuleFiles.some((file) => file.fileName === name);

  const successfullyReadFileCount = ruleFiles.filter(
    (fileData) => fileData.loadResult === "success"
  ).length;

  const getloadPercentage = (filename: string) => {
    const readFile = ruleFiles.find((file) => file.fileName === filename);
    if (readFile) return readFile.loadPercentage;
    return 0;
  };

  const getloadResult = (filename: string) => {
    const readFile = ruleFiles.find((file) => file.fileName === filename);
    if (readFile) return readFile.loadResult;
    return undefined;
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

  // callback that will be called by the react dropzone with the newly dropped file objects
  const handleFileDrop = (droppedFiles: File[]) => {
    // identify what, if any, files are re-uploads of already uploaded files
    const currentFileNames = ruleFiles.map((file) => file.fileName);
    const reUploads = droppedFiles.filter((droppedFile) =>
      currentFileNames.includes(droppedFile.name)
    );
    /** this promise chain is needed because if the file removal is done at the same time as the file adding react
     * won't realize that the status items for the re-uploaded files needs to be re-rendered */
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
        setRuleFiles((prevRuleFiles) => [
          ...prevRuleFiles,
          ...droppedReadFiles,
        ]);
      });
  };

  const removeFiles = (namesOfFilesToRemove: string[]) => {
    const updatedRuleFilesList = ruleFiles.filter(
      (currentFile) =>
        !namesOfFilesToRemove.some(
          (fileName) => fileName === currentFile.fileName
        )
    );
    setRuleFiles(updatedRuleFilesList);
    if (methods) {
      methods.setValue(
        "customRulesFiles",
        updatedRuleFilesList.filter(
          (ruleFile) => ruleFile.loadResult === "success"
        ),
        { shouldDirty: true, shouldValidate: true }
      );
      methods.trigger("customRulesFiles");
    }
  };

  const handleFile = (file: File) => {
    readFile(file)
      .then((data) => {
        if (isFileIncluded(file.name) && !taskgroupID) {
          //If existing file loaded in edit mode, add placeholder file for custom target form
          handleReadSuccess(data || "", file);
        } else {
          if (isFileIncluded(file.name)) {
            const error = new Error(`File "${file.name}" is already uploaded`);
            handleReadFail(error, 100, file);
          } else {
            if (data) {
              const validatedXMLResult = validateXMLFile(data);
              if (validatedXMLResult.state === "valid")
                handleReadSuccess(data, file);
              else {
                const error = new Error(
                  `File "${file.name}" is not a valid XML: ${validatedXMLResult.message}`
                );
                handleReadFail(error, 100, file);
              }
            }
          }
        }
      })
      .catch((error) => {
        handleReadFail(error, 0, file);
      });
  };

  const handleReadSuccess = (data: string, file: File) => {
    if (taskgroupID) {
      // Upload file to bucket if bucket exists / in analysis wizard mode
      const newFile: IReadFile = {
        data,
        fileName: file.name,
        loadResult: "success",
        loadPercentage: 100,
        fullFile: file,
      };
      const formFile = new FormData();
      newFile.fullFile && formFile.append("file", newFile.fullFile);
      uploadFile({
        id: taskgroupID as number,
        path: `rules/${newFile.fileName}`,
        formData: formFile,
        file: newFile,
      });
    } else {
      const newFile: IReadFile = {
        data,
        fileName: file.name,
        loadResult: "success",
        loadPercentage: 100,
        fullFile: file,
      };
      const formFile = new FormData();
      newFile.fullFile && formFile.append("file", newFile?.fullFile);
      createRuleFile({
        formData: formFile,
        file: newFile,
      });
    }
  };

  const handleReadFail = (error: Error, percentage: number, file: File) => {
    setUploadError(error.toString());
    const fileWithErrorState: IReadFile = {
      loadError: error as FileLoadError,
      fileName: file.name,
      loadResult: "danger",
      loadPercentage: percentage,
      fullFile: file,
    };
    const updatedFiles = [...ruleFiles];
    const ruleFileToUpdate = ruleFiles.findIndex(
      (ruleFile) => ruleFile.fileName === file.name
    );
    updatedFiles[ruleFileToUpdate] = fileWithErrorState;

    setRuleFiles(updatedFiles);
  };

  // only show the status component once a file has been uploaded, but keep the status list component itself even if all files are removed
  if (!showStatus && existingRuleFiles.length > 0) {
    setShowStatus(true);
  }

  interface IParsedXMLFileStatus {
    state: "valid" | "error";
    message?: string;
  }

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

  return {
    handleFileDrop,
    removeFiles,
    existingRuleFiles,
    setRuleFiles,
    ruleFiles,
    showStatus,
    uploadError,
    setUploadError,
    successfullyReadFileCount,
    getloadPercentage,
    getloadResult,
    setStatus,
    handleFile,
  };
}
