# Development

This document describes the process for running and developing tackle2-ui on your local computer.

## Getting started

Tackle2-ui can be developed using macOS(x86_64 only) or Linux environments.

## React hooks

Our project utilizes [Hooks](https://reactjs.org/docs/hooks-intro.html) wherever possible as this pattern has been proven and settled on in the react community. The hooks pattern is highly testable and provides a clear way to reuse stateful logic without overcomplicating components with complex lifecycle methods. Overall, we have largely left class components behind and have adopted functional components / hooks as the way forward.

## Styling components

For any custom styles, we use standard css with no preprocessors. If a custom style is needed, create a css file and import it within the component.
For handling spacing/layout requirements that do not fit the standard PF mold, we are able to use the [Patternfly spacing utility classes](https://www.patternfly.org/utility-classes/spacing/).

## Form development

We are using [react-hook-form](https://react-hook-form.com) in tandem with [patternfly](https://www.patternfly.org). Custom wrapper components have been developed to aid with this integration and their usage can be referenced in the [proxy-form](./client/src/app/pages/proxies/proxy-form.tsx) component.

### Steps to create a form

- Create a TypeScript interface for all your form value keys/types

```
export interface FormValues {
  formField: string;
}
```

- Define a schema for your values using yup [example](https://github.com/konveyor/tackle2-ui/blob/main/client/src/app/pages/proxies/proxies-validation-schema.ts#L7-L67)

  - For TypeScript to be happy, you may have to chain .defined() on some field schema types so it doesn't yell at you for e.g. Type `string | undefined` is not assignable to type `string`.

  - You want to have your schema returned by a function beginning with the word use, so it can fit with the React Hooks conventions and call `useTranslation()` to get you the `t()` function for translated validation error messages. Or if the form is small enough you can just define the schema inline.

- Call `useForm` (from react-hook-form) and pass it your interface as a `type` param. Pass it an object with `defaultValues`, `resolver: yupResolver(yourSchemaHere)`, and `mode: "onChange"` (this will revalidate when any field changes, as opposed to requiring manual imperative validation. We need this option for the way we render errors).

  - `useForm` returns an object with a bunch of stuff. We usually destructure it in-place like you see here. Important things you'll need to pull out include `control`, probably `formState` if you need to block some buttons based on validation, `getValues` and `setValue` if you need to get/set anything manually (might not be necessary), and `watch` (more info on `watch` [here](https://react-hook-form.com/api/useform/watch/)) .

    - Note: `watch` will not be needed if you are using least one controlled input field via our controller components below since the presence of a controlled input will cause RHF to auto-watch the form values anyway.

- Write an onSubmit function of type `SubmitHandler<YourValuesInterface>`. Wrap your form fields in a PF `<Form>` component with `onSubmit={handleSubmit(onSubmit)}` where `handleSubmit` came from your `useForm` call. That's where you'll eventually want to do the submit logic, probably using [mutations](https://tanstack.com/query/v4/docs/framework/react/guides/mutations) from react-query.

### react-hook-form / wrapper component usage

- Now you can use our new components for the fields themselves. They will take care of rendering the PF FormGroups and properly styled validation errors. Pass them the `control` prop from your `useForm` call and a name string prop matching the field name key from your form values object. TS is smart enough to infer the right field value type from those 2 props.

  - If you're rendering a basic text input, you can use `HookFormPFTextInput` ([source](https://github.com/konveyor/tackle2-ui/blob/main/client/src/app/components/HookFormPFFields/HookFormPFTextInput.tsx), [example](https://github.com/konveyor/tackle2-ui/blob/main/client/src/app/pages/proxies/proxy-form.tsx)). It extends the props of PatternFly's [TextInput](https://www.patternfly.org/components/forms/text-input/#textinput), so you can pass whatever extra stuff you need directly into it.

  - Same for a multi-line textarea, you can use `HookFormPFTextArea` ([source](https://github.com/konveyor/tackle2-ui/blob/main/client/src/app/components/HookFormPFFields/HookFormPFTextArea.tsx), [example](https://github.com/konveyor/tackle2-ui/blob/main/client/src/app/pages/proxies/proxy-form.tsx)) which extends the props of PF [TextArea](https://www.patternfly.org/components/forms/text-area).

  - For any other type of field that requires a PF `FormGroup` (label, error messages under the field) you can use the `HookFormPFGroupController` that is used internally by those 2 components, and pass it your own `renderField` function. (source, example). For select dropdowns we have a simplified abstraction called [SimpleSelect](https://github.com/konveyor/tackle2-ui/blob/main/client/src/app/components/SimpleSelect.tsx).

  - These all use the Controller pattern from react-hook-form (docs [here](https://react-hook-form.com/get-started#IntegratingwithUIlibraries) and [here](https://react-hook-form.com/api/usecontroller/controller)). You generally don't want to use the `{...register('fieldName')}` approach that is all over their docs, it is for uncontrolled inputs (we need controlled inputs to render errors on change).
  - All of the above components include a formGroupProps prop in case you need to override any of the [props for PF's FormGroup](https://www.patternfly.org/components/forms/form#field-groups) that aren't taken care of for you.

- If you don't need a `FormGroup` around your field (no external label or errors), you can just render a <Controller> for it yourself. That's what we do for [Switch](https://www.patternfly.org/components/switch) fields (because switch has a built in right-aligned label). ([example](https://github.com/konveyor/tackle2-ui/blob/main/client/src/app/pages/proxies/proxy-form.tsx))

## READMEs

For more info about working on the Tackle 2.x UI, check out these READMEs:

- [tests.md](./tests.md)
- [internationalization.md](./INTERNATIONALIZATION.md)
