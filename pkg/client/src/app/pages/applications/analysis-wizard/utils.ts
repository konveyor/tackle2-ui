import { Application } from "@app/api/models";

export const isApplicationBinaryEnabled = (
  application: Application
): boolean => {
  if (application.binary !== "::" && application.binary?.match(/.+:.+:.+/))
    return true;
  return false;
};

export const isApplicationSourceCodeEnabled = (
  application: Application
): boolean => {
  if (application.repository && application.repository.url !== "") return true;
  return false;
};

export const isApplicationSourceCodeDepsEnabled = (
  application: Application
): boolean => {
  if (application.repository && application.repository.url !== "") return true;
  return false;
};

export const isModeSupported = (application: Application, mode: string) => {
  if (mode.includes("Upload")) return true;
  if (mode.includes("Binary")) return isApplicationBinaryEnabled(application);
  else if (mode.includes("dependencies"))
    return isApplicationSourceCodeDepsEnabled(application);
  else return isApplicationSourceCodeEnabled(application);
};
