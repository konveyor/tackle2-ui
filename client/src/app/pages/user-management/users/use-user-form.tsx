import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";
import { create as array } from "yup/lib/array";
import { create as object } from "yup/lib/object";
import { create as string } from "yup/lib/string";

import { NewUser } from "@app/api/rest";

import { User } from "../types";

import { useUserActionsWithNotifications } from "./use-users";

/** Seeded users (ID < 1000) cannot have their roles replaced via PUT. */
export const isSeededUser = (user: User) => user.id < 1000;

/** Value the server sends back when the password is masked. */
const MASKED_PASSWORD = "_/>>MASKED-SECRET<</_";

const DEFAULT_USER_FORM: UserFormValues = {
  login: "",
  password: "",
  confirmPassword: "",
  name: "",
  email: "",
  roles: [],
};

export const useUserForm = (user?: User, onClose?: () => void) => {
  const { editUser, createUser } = useUserActionsWithNotifications();
  const isEdit = !!user;
  const isSeeded = user ? isSeededUser(user) : false;

  const validationSchema = object().shape({
    login: string().required().min(1),
    password: isEdit ? string().max(72) : string().required().max(72),
    confirmPassword: string()
      .test("passwords-match", "Passwords must match", function (value) {
        const { password } = this.parent as UserFormValues;
        if (!password) return true; // no new password → nothing to confirm
        return value === password;
      })
      .when("password", {
        is: (val: string) => !!val,
        then: (s) => s.required("Please confirm the password"),
      }),
    name: string().required(),
    email: string().email().required(),
    roles: array().of(object()).required(),
  });

  const form = useForm<UserFormValues>({
    defaultValues: user
      ? { ...user, password: "", confirmPassword: "" }
      : DEFAULT_USER_FORM,
    resolver: yupResolver(validationSchema),
    mode: "all",
  });

  const onValidSubmit = (values: UserFormValues) => {
    if (isEdit) {
      const userToSave = valuesToExistingUser(values, user!, isSeeded);
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
    isSeeded,
  };
};

export interface UserFormValues {
  login: string;
  password: string;
  confirmPassword: string;
  name: string;
  email: string;
  roles: User["roles"];
}

/** Build the minimal payload for POST /users (only fields the hub accepts). */
export const valuesToNewUser = (values: UserFormValues): NewUser => ({
  login: values.login,
  name: values.name,
  email: values.email,
  password: values.password,
  roles: values.roles,
});

/** Build the full user object for PUT /users/:id.
 *  - Empty password → send the masked sentinel so the server keeps the existing hash.
 *  - Seeded users (ID < 1000) → omit roles (server rejects role changes for built-ins).
 */
export const valuesToExistingUser = (
  values: UserFormValues,
  user: User,
  isSeeded: boolean
): User => ({
  ...user,
  name: values.name,
  email: values.email,
  password: values.password || MASKED_PASSWORD,
  ...(!isSeeded ? { roles: values.roles } : {}),
});
