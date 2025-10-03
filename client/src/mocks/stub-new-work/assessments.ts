import { rest } from "msw";

import { Assessment, InitialAssessment } from "@app/api/models";
import { hub } from "@app/api/rest";

import { mockApplicationArray } from "./applications";
import questionnaireData from "./questionnaireData";

let assessmentCounter = 1;

function generateNewAssessmentId() {
  const newAssessmentId = assessmentCounter;
  assessmentCounter++;
  return newAssessmentId;
}

const mockAssessmentArray: Assessment[] = [
  {
    id: 43,
    status: "started",
    name: "test",
    questionnaire: { id: 1, name: "Sample Questionnaire" },
    description: "Sample assessment description",
    risk: "yellow",
    sections: [
      {
        name: "Application technologies 1",
        order: 1,
        questions: [
          {
            order: 1,
            text: "What is the main technology in your application?",
            explanation:
              "What would you describe as the main framework used to build your application.",
            answers: [
              {
                order: 1,
                text: "Unknown",
                rationale: "This is a problem because of the uncertainty.",
                mitigation:
                  "Gathering more information about this is required.",
                risk: "unknown",
                selected: false,
              },
              {
                order: 2,
                text: "Quarkus",
                risk: "green",
                autoAnswerFor: [
                  {
                    category: "Cat 1",
                    tag: "Tag 1",
                  },
                ],
                applyTags: [
                  {
                    category: "Cat 1",
                    tag: "Tag 1",
                  },
                ],
                selected: true,
              },
              {
                order: 3,
                text: "Spring Boot",
                risk: "green",
                selected: false,
              },
              {
                order: 4,
                text: "Java EE",
                rationale:
                  "This might not be the most cloud friendly technology.",
                mitigation:
                  "Maybe start thinking about migrating to Quarkus or Jakarta EE.",
                risk: "yellow",
                selected: false,
              },
              {
                order: 5,
                text: "J2EE",
                rationale: "This is obsolete.",
                mitigation:
                  "Maybe start thinking about migrating to Quarkus or Jakarta EE.",
                risk: "red",
                selected: false,
              },
            ],
          },
          {
            order: 2,
            text: "What version of Java EE does the application use?",
            explanation:
              "What version of the Java EE specification is your application using?",
            answers: [
              {
                order: 1,
                text: "Below 5.",
                rationale: "This technology stack is obsolete.",
                mitigation: "Consider migrating to at least Java EE 7.",
                risk: "red",
                selected: true,
              },
              {
                order: 2,
                text: "5 or 6",
                rationale: "This is a mostly outdated stack.",
                mitigation: "Consider migrating to at least Java EE 7.",
                risk: "yellow",
                selected: false,
              },
              {
                order: 3,
                text: "7",
                risk: "green",
                selected: false,
              },
            ],
          },
          {
            order: 3,
            text: "Does your application use any caching mechanism?",
            answers: [
              {
                order: 1,
                text: "Yes",
                rationale:
                  "This could be problematic in containers and Kubernetes.",
                mitigation:
                  "Review the clustering mechanism to check compatibility and support for container environments.",
                risk: "yellow",
                selected: true,
              },
              {
                order: 2,
                text: "No",
                risk: "green",
                selected: false,
              },
              {
                order: 3,
                text: "Unknown",
                rationale: "This is a problem because of the uncertainty.",
                mitigation:
                  "Gathering more information about this is required.",
                risk: "unknown",
                selected: false,
              },
            ],
          },
          {
            order: 4,
            text: "What implementation of JAX-WS does your application use?",
            answers: [
              {
                order: 1,
                text: "Apache Axis",
                rationale: "This version is obsolete",
                mitigation: "Consider migrating to Apache CXF",
                risk: "red",
                selected: false,
              },
              {
                order: 2,
                text: "Apache CXF",
                risk: "green",
                selected: true,
              },
              {
                order: 3,
                text: "Unknown",
                rationale: "This is a problem because of the uncertainty.",
                mitigation:
                  "Gathering more information about this is required.",
                risk: "unknown",
                selected: false,
              },
            ],
          },
        ],
      },
    ],
    riskMessages: {
      green: "Low risk",
      red: "High risk",
      unknown: "Unknown risk",
      yellow: "Moderate risk",
    },
    thresholds: {
      red: 3,
      unknown: 2,
      yellow: 4,
    },
    application: { id: 1, name: "App 1" },
    stakeholderGroups: [],
    stakeholders: [],
  },
];

export const handlers = [
  rest.get(hub`/questionnaires`, (req, res, ctx) => {
    return res(ctx.json(questionnaireData));
  }),

  rest.get(hub`/assessments`, (req, res, ctx) => {
    return res(ctx.json(mockAssessmentArray));
  }),

  rest.get(hub`/applications/:applicationId/assessments`, (req, res, ctx) => {
    // Extract the applicationId from the route parameters
    const applicationId = parseInt(req?.params?.applicationId as string, 10);

    // Filter the mock assessments based on the applicationId
    const filteredAssessments = mockAssessmentArray.filter(
      (assessment) => assessment?.application?.id === applicationId
    );

    return res(ctx.json(filteredAssessments));
  }),

  rest.get(hub`/assessments/:assessmentId`, (req, res, ctx) => {
    const { assessmentId } = req.params;

    const foundAssessment = mockAssessmentArray.find(
      (assessment) => assessment.id === parseInt(assessmentId as string)
    );

    if (foundAssessment) {
      return res(ctx.json(foundAssessment));
    } else {
      return res(ctx.status(404), ctx.json({ error: "Assessment not found" }));
    }
  }),
  //TODO Finish updating mocks
  rest.post(hub`/assessments`, async (req, res, ctx) => {
    console.log("req need to find questionnaire id", req);

    const initialAssessment: InitialAssessment = await req.json();

    const newAssessmentId = generateNewAssessmentId();

    const newAssessment: Assessment = {
      id: newAssessmentId,
      status: "started",
      name: "test",
      description: "Sample assessment description",
      risk: "yellow",
      sections: [],
      riskMessages: {
        green: "Low risk",
        red: "High risk",
        unknown: "Unknown risk",
        yellow: "Moderate risk",
      },
      thresholds: {
        red: 3,
        unknown: 2,
        yellow: 4,
      },
      application: initialAssessment.application,
      questionnaire: initialAssessment.questionnaire,
      stakeholderGroups: [],
      stakeholders: [],
    };

    mockAssessmentArray.push(newAssessment);

    const relatedApplicationIndex = mockApplicationArray.findIndex(
      (application) => application.id === newAssessment?.application?.id
    );
    if (relatedApplicationIndex !== -1) {
      mockApplicationArray[relatedApplicationIndex]?.assessments?.push({
        id: newAssessmentId,
        name: newAssessment.name,
      });
    }

    return res(ctx.json(newAssessment), ctx.status(201));
  }),
  rest.patch(hub`/assessments/:assessmentId`, async (req, res, ctx) => {
    const { assessmentId } = req.params;
    const updatedData = await req.json();

    const foundAssessmentIndex = mockAssessmentArray.findIndex(
      (assessment) => assessment.id === parseInt(assessmentId as string)
    );

    if (foundAssessmentIndex !== -1) {
      mockAssessmentArray[foundAssessmentIndex] = {
        ...mockAssessmentArray[foundAssessmentIndex],
        ...updatedData,
      };

      mockApplicationArray.forEach((application) => {
        application?.assessments?.forEach((assessment) => {
          if (assessment.id === parseInt(assessmentId as string)) {
            assessment = {
              ...assessment,
            };
          }
        });
      });

      return res(
        ctx.status(200),
        ctx.json(mockAssessmentArray[foundAssessmentIndex])
      );
    } else {
      return res(ctx.status(404), ctx.json({ error: "Assessment not found" }));
    }
  }),
  rest.delete(hub`/assessments/:assessmentId`, (req, res, ctx) => {
    const { assessmentId } = req.params;

    const foundIndex = mockAssessmentArray.findIndex(
      (assessment) => assessment.id === parseInt(assessmentId as string)
    );

    if (foundIndex !== -1) {
      // Remove the assessment from the mock array
      const deletedAssessment = mockAssessmentArray.splice(foundIndex, 1)[0];

      // Find and remove the assessment reference from the related application
      const relatedApplicationIndex = mockApplicationArray.findIndex(
        (application) => application?.id === deletedAssessment?.application?.id
      );
      if (relatedApplicationIndex !== -1) {
        const relatedApplication =
          mockApplicationArray[relatedApplicationIndex];
        if (relatedApplication?.assessments) {
          const assessmentIndex = relatedApplication.assessments.findIndex(
            (assessment) => assessment.id === deletedAssessment.id
          );
          if (assessmentIndex !== -1) {
            relatedApplication.assessments.splice(assessmentIndex, 1);
          }
        }
      }

      return res(ctx.status(204)); // Return a 204 (No Content) status for a successful delete
    } else {
      return res(ctx.status(404), ctx.json({ error: "Assessment not found" }));
    }
  }),
];

export default handlers;
