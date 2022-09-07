import * as React from "react";
import { FieldValues, Path, UseFormReturn } from "react-hook-form";

export interface RHFTextFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends Path<TFieldValues> = Path<TFieldValues>
> {
  form: UseFormReturn<TFieldValues>;
  name: TName;
}

// Generic type params here are the same as the ones used by <Controller>
export const RHFTextField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends Path<TFieldValues> = Path<TFieldValues>
>({
  name,
}: React.PropsWithChildren<RHFTextFieldProps<TFieldValues, TName>>) => null;
