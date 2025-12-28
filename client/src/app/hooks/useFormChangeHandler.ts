import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
} from "react";
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
  /**
   * Callback invoked whenever the mapped form state changes.
   * @remarks This callback is stored in a ref internally, so callers do not need
   *          to memoize it with useCallback to avoid infinite re-renders.
   */
  onStateChanged: (state: TState) => void;
  /**
   * Optional function to map form values to state. Defaults to a function that adds the
   * isValid field to the form values.
   * @remarks This callback must be stable (e.g. wrapped in useCallback) to prevent
   *          an infinite re-render loop.
   */
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

  // Store onStateChanged in a ref so the effect depends only on `state`.
  // This avoids infinite re-renders when callers pass an unstable callback.
  const onStateChangedRef = useRef(onStateChanged);
  useLayoutEffect(() => {
    onStateChangedRef.current = onStateChanged;
  });

  useEffect(() => {
    onStateChangedRef.current(state);
  }, [state]);
};
