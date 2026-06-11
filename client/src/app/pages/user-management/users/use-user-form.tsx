import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";
import { create as array } from "yup/lib/array";
import { create as object } from "yup/lib/object";
import { create as string } from "yup/lib/string";

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

export const useUserForm = (user?: User) => {
  const { editUser, createUser } = useUserActionsWithNotifications();
  const validationSchema = object().shape({
    name: string().required(),
    email: string().email().required(),
    roles: array().of(string()).required(),
  });
  const form = useForm<UserFormValues>({
    defaultValues: user ?? DEFAULT_USER,
    resolver: yupResolver(validationSchema),
    mode: "all",
  });
  const onValidSubmit = (values: UserFormValues) => {
    const userToSave = valuesToUser(values, user ?? DEFAULT_USER);
    if (user) {
      editUser(userToSave);
    } else {
      createUser(userToSave);
    }
  };

  const {
    handleSubmit,
    formState: { isSubmitting, isValidating, isValid, isDirty },
  } = form;
  const isSubmitDisabled = !isValid || isSubmitting || isValidating || !isDirty;

  return { form, onSubmit: handleSubmit(onValidSubmit), isSubmitDisabled };
};

export type UserFormValues = Pick<User, "name" | "email" | "roles">;

export const valuesToUser = (values: UserFormValues, user: User): User => {
  return {
    ...user,
    name: values.name,
    email: values.email,
    roles: values.roles,
  };
};
