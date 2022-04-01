export const checkAccess = (
  userPermissions: string[],
  allowedPermissions: string[]
) => {
  const access = userPermissions.some((userPermission) =>
    allowedPermissions.includes(userPermission)
  );
  return access;
};
