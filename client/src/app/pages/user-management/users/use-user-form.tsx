import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";
import { create as array } from "yup/lib/array";
import { create as object } from "yup/lib/object";
import { create as string } from "yup/lib/string";

import { NewUser } from "@app/api/rest";

import { User } from "../types";

import { useUserActionsWithNotifications } from "./use-users";

const DEFAULT_USER: User = {
  subject: "",
  login: "",
  password: "",
  tokens: [],
  id: 0,
  createUser: "",
  updateUser: "",
  name: "",
  email: "",
  roles: [],
  createTime: "",
};

export const useUserForm = (user?: User, onClose?: () => void) => {
  const { editUser, createUser } = useUserActionsWithNotifications();
  const isEdit = !!user;

  const validationSchema = object().shape({
    login: string().required().min(1),
    password: isEdit ? string().max(72) : string().required().max(72),
    name: string().required(),
    email: string().email().required(),
    roles: array().of(object()).required(),
  });

  const form = useForm<UserFormValues>({
    defaultValues: user ?? DEFAULT_USER,
    resolver: yupResolver(validationSchema),
    mode: "all",
  });

  const onValidSubmit = (values: UserFormValues) => {
    if (isEdit) {
      const userToSave = valuesToExistingUser(values, user!);
      editUser(userToSave, { onSuccess: onClose });
    } else {
      const userToSave = valuesToNewUser(values);
      createUser(userToSave, { onSuccess: onClose });
    }
  };

  const {
    handleSubmit,
    formState: { isSubmitting, isValidating, isValid, isDirty },
  } = form;
  const isSubmitDisabled = !isValid || isSubmitting || isValidating || !isDirty;

  return {
    form,
    onSubmit: handleSubmit(onValidSubmit),
    isSubmitDisabled,
    isEdit,
  };
};

export type UserFormValues = Pick<
  User,
  "name" | "email" | "roles" | "login" | "password"
>;

/** Build the minimal payload for POST /users (only fields the hub accepts). */
export const valuesToNewUser = (values: UserFormValues): NewUser => ({
  login: values.login,
  name: values.name,
  email: values.email,
  password: values.password,
  roles: values.roles,
});

/** Build the full user object for PUT /users/:id, only updating password when provided. */
export const valuesToExistingUser = (
  values: UserFormValues,
  user: User
): User => ({
  ...user,
  name: values.name,
  email: values.email,
  roles: values.roles,
  ...(values.password ? { password: values.password } : {}),
});
