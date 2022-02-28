import * as React from "react";
import "@patternfly/react-core/dist/styles/base.css";
import {
  Breadcrumb,
  BreadcrumbItem,
  Level,
  LevelItem,
  PageSection,
  Title,
  Wizard,
} from "@patternfly/react-core";
import SampleForm from "./sampleform";
import { Link } from "react-router-dom";

export const ValidationWizard: React.FunctionComponent = () => {
  const [isFormValid, setFormValid] = React.useState(false);
  const [formValue, setFormValue] = React.useState("Thirty");
  const [allStepsValid, setallStepsValid] = React.useState(false);
  const [stepIdReached, setStepReached] = React.useState(1);

  const closeWizard = () => {
    console.log("close wizard");
  };

  const onFormChange = (isValid: boolean, value: any) => {
    setFormValid(isValid);
    setFormValue(value);
    setallStepsValid(isFormValid);
  };

  const areAllStepsValid = () => setallStepsValid(isFormValid);

  //   const onNext = ({ id, name }, { prevId, prevName }) => {
  const onNext = (val: any, steps: any) => {
    console.log(
      `current id: ${val.id}, current name: ${val.name}, previous id: ${steps.prevId}, previous name: ${steps.prevName}`
    );
    setStepReached(stepIdReached < val.id ? val.id : stepIdReached);
    areAllStepsValid();
  };

  //   const onBack = ({ id, name }, { prevId, prevName }) => {
  const onBack = (val: any, steps: any) => {
    console.log(
      `current id: ${val.id}, current name: ${val.name}, previous id: ${steps.prevId}, previous name: ${steps.prevName}`
    );
    areAllStepsValid();
  };

  //   const onGoToStep = ({ id, name }, { prevId, prevName }) => {
  const onGoToStep = (val: any, steps: any) => {
    console.log(
      `current id: ${val.id}, current name: ${val.name}, previous id: ${steps.prevId}, previous name: ${steps.prevName}`
    );
  };

  const onSave = () => {
    console.log("Saved and closed the wizard");
  };

  const steps = [
    { id: 1, name: "Information", component: <p>Step 1 content</p> },
    {
      name: "Configuration",
      steps: [
        {
          id: 2,
          name: "Substep A with validation",
          component: (
            <SampleForm
              formValue={formValue}
              isFormValid={isFormValid}
              onChange={onFormChange}
            />
          ),
          enableNext: isFormValid,
          canJumpTo: stepIdReached >= 2,
        },
        {
          id: 3,
          name: "Substep B",
          component: <p>Substep B</p>,
          canJumpTo: stepIdReached >= 3,
        },
      ],
    },
    {
      id: 4,
      name: "Additional",
      component: <p>Step 3 content</p>,
      enableNext: allStepsValid,
      canJumpTo: stepIdReached >= 4,
    },
    {
      id: 5,
      name: "Review",
      component: <p>Step 4 content</p>,
      nextButtonText: "Close",
      canJumpTo: stepIdReached >= 5,
    },
  ];

  const title = "Validation wizard";
  return (
    <>
      <PageSection title="blah" variant="light">
        <Breadcrumb>
          <BreadcrumbItem>
            <Link to={`/applications`}>applications</Link>
          </BreadcrumbItem>
          <BreadcrumbItem>Analysis</BreadcrumbItem>
        </Breadcrumb>
        <Level>
          <LevelItem>
            <Title headingLevel="h1">{title}</Title>
          </LevelItem>
        </Level>
      </PageSection>
      <PageSection variant="light" type="wizard">
        <Wizard
          title={title}
          description="Blah"
          navAriaLabel={`${title} steps`}
          mainAriaLabel={`${title} content`}
          onClose={closeWizard}
          onSave={onSave}
          steps={steps}
          onNext={onNext}
          onBack={onBack}
          onGoToStep={onGoToStep}
          height={400}
        />
      </PageSection>
    </>
  );
};
