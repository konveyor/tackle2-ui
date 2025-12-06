import { useCallback, useEffect, useMemo } from "react";
import {
  DeepPartialSkipArrayKey,
  FieldValues,
  UseFormReturn,
  useWatch,
} from "react-hook-form";

/** Default state type when no custom mapFormToState is provided */
export type DefaultFormState<TFormValues extends FieldValues> =
  DeepPartialSkipArrayKey<TFormValues> & { isValid: boolean };

/**
 * Generic form change handler that watches form fields and calls a state change callback.
 * @template TFormValues - The type of the form values
 * @template TState - The type of the state object (defaults to form values + isValid)
 */
export const useFormChangeHandler = <
  TFormValues extends FieldValues,
  TState = DefaultFormState<TFormValues>,
>({
  form,
  onStateChanged,
  mapFormToState,
}: {
  form: UseFormReturn<TFormValues>;
  onStateChanged: (state: TState) => void;
  mapFormToState?: (
    values: DeepPartialSkipArrayKey<TFormValues>,
    isFormValid: boolean
  ) => TState;
}) => {
  const {
    control,
    formState: { isValid },
  } = form;

  const watchedValues: DeepPartialSkipArrayKey<TFormValues> = useWatch({
    control,
  });

  const defaultMapper = useCallback(
    (values: DeepPartialSkipArrayKey<TFormValues>, isFormValid: boolean) =>
      ({ ...values, isValid: isFormValid }) as TState,
    []
  );

  const mapper = mapFormToState ?? defaultMapper;

  const state = useMemo(
    (): TState => mapper(watchedValues, isValid),
    [mapper, watchedValues, isValid]
  );

  useEffect(() => {
    onStateChanged(state);
  }, [onStateChanged, state]);
};
