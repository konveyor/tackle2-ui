export const checkAccess = (userRoles: string[], roles: string[]) => {
  const access = userRoles.some((role) => roles.includes(role));
  return access;
};
