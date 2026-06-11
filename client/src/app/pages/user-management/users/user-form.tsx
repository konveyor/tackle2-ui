import { FC } from "react";
import { UseFormReturn } from "react-hook-form";

import { UserFormValues } from "./use-user-form";

export interface UserFormProps {
  form: UseFormReturn<UserFormValues>;
  onClose: () => void;
  onSubmit: () => void;
}
export const UserForm: FC<UserFormProps> = () => {
  return (
    <div>
      UserFormUserFormUs erFormUserFormUserFor
      mUserFormUserFormUserFormUserFormUserForm
      UserFormUserFormUserFormUserFormUserFormU
      serFormUserFormUserFormUserFormUserFormU
      serFormUserFormUserFormUserFormUserFormU serFormUserForm
    </div>
  );
};
