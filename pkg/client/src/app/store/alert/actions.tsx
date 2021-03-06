import { addNotification } from "@redhat-cloud-services/frontend-components-notifications/redux";

type Variant = "danger" | "success" | "info";

export const addAlert = (
  variant: Variant,
  title: string,
  description?: string
) => {
  return addNotification({
    variant,
    title,
    description,
  });
};

export const addInfo = (title: string, description?: string) => {
  return addAlert("info", title, description);
};

export const addSuccess = (title: string, description?: string) => {
  return addAlert("success", title, description);
};

export const addDanger = (title: string, description?: string) => {
  return addAlert("danger", title, description);
};
