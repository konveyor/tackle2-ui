import { useEffect, useMemo } from "react";
import {
  FieldPathValues,
  FieldValues,
  Path,
  UseFormReturn,
  useWatch,
} from "react-hook-form";

/**
 * Generic form change handler that watches specific form fields and calls a state change callback.
 * @template TFormValues - The type of the form values
 * @template TState - The type of the state object
 * @template TWatchFields - The tuple type of field paths being watched
 */
export const useFormChangeHandler = <
  TFormValues extends FieldValues,
  TState,
  TWatchFields extends Path<TFormValues>[],
>({
  form,
  onStateChanged,
  watchFields,
  mapValuesToState,
}: {
  form: UseFormReturn<TFormValues>;
  onStateChanged: (state: TState) => void;
  watchFields: TWatchFields;
  mapValuesToState: (
    values: FieldPathValues<TFormValues, TWatchFields>,
    isFormValid: boolean
  ) => TState;
}) => {
  const {
    control,
    formState: { isValid },
  } = form;

  const watchedValues = useWatch<TFormValues>({
    control,
    name: [...watchFields] as Path<TFormValues>[],
  }) as FieldPathValues<TFormValues, TWatchFields>;

  const state = useMemo((): TState => {
    return mapValuesToState(watchedValues, isValid);
  }, [mapValuesToState, watchedValues, isValid]);

  useEffect(() => {
    onStateChanged(state);
  }, [onStateChanged, state]);
};
