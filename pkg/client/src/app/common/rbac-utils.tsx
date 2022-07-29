import { isAuthRequired } from "@app/Constants";

export const checkAccess = (
  userPermissions: string[],
  allowedPermissions: string[]
) => {
  if (!isAuthRequired) return true;
  const access = userPermissions.some((userPermission) =>
    allowedPermissions.includes(userPermission)
  );
  return access;
};

export const checkAccessAll = (
  userPermissions: string[],
  allowedPermissions: string[]
) => {
  if (!isAuthRequired) return true;
  const access = userPermissions.every((userPermission) =>
    allowedPermissions.includes(userPermission)
  );
  return access;
};
