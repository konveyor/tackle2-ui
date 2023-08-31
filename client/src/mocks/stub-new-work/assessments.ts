import { Questionnaire, Assessment } from "@app/api/models";
import { rest } from "msw";

import * as AppRest from "@app/api/rest";
import { mockApplicationArray } from "./applications";

const mockQuestionnaire: Questionnaire = {
  id: 1,
  name: "Sample Questionnaire",
  description: "This is a sample questionnaire",
  revision: 1,
  questions: 5,
  rating: "High",
  dateImported: "2023-08-25",
  required: true,
  system: false,
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
              mitigation: "Gathering more information about this is required.",
              risk: "unknown",
            },
            {
              order: 2,
              text: "Quarkus",
              risk: "green",
              autoAnswerFor: [
                {
                  category: {
                    name: "Cat 1",
                    id: 23,
                  },
                  tag: {
                    id: 34,
                    name: "Tag 1",
                  },
                },
              ],
              applyTags: [
                {
                  category: {
                    name: "Cat 1",
                    id: 23,
                  },
                  tag: {
                    id: 34,
                    name: "Tag 1",
                  },
                },
              ],
            },
            {
              order: 3,
              text: "Spring Boot",
              risk: "green",
            },
            {
              order: 4,
              text: "Java EE",
              rationale:
                "This might not be the most cloud friendly technology.",
              mitigation:
                "Maybe start thinking about migrating to Quarkus or Jakarta EE.",
              risk: "yellow",
            },
            {
              order: 5,
              text: "J2EE",
              rationale: "This is obsolete.",
              mitigation:
                "Maybe start thinking about migrating to Quarkus or Jakarta EE.",
              risk: "red",
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
            },
            {
              order: 2,
              text: "5 or 6",
              rationale: "This is a mostly outdated stack.",
              mitigation: "Consider migrating to at least Java EE 7.",
              risk: "yellow",
            },
            {
              order: 3,
              text: "7",
              risk: "green",
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
            },
            {
              order: 2,

              text: "No",
              risk: "green",
            },
            {
              order: 3,
              text: "Unknown",
              rationale: "This is a problem because of the uncertainty.",
              mitigation: "Gathering more information about this is required.",
              risk: "unknown",
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
            },
            {
              order: 2,
              text: "Apache CXF",
              risk: "green",
            },
            {
              order: 3,
              text: "Unknown",
              rationale: "This is a problem because of the uncertainty.",
              mitigation: "Gathering more information about this is required.",
              risk: "unknown",
            },
          ],
        },
      ],
    },
  ],
  thresholds: {
    red: 3,
    unknown: 2,
    yellow: 4,
  },
  riskMessages: {
    green: "Low risk",
    red: "High risk",
    unknown: "Unknown risk",
    yellow: "Moderate risk",
  },
};

let assessmentCounter = 1;

function generateNewAssessmentId() {
  const newAssessmentId = assessmentCounter;
  assessmentCounter++;
  return newAssessmentId;
}

const mockAssessmentArray: Assessment[] = [];

export const handlers = [
  rest.get(AppRest.QUESTIONNAIRES, (req, res, ctx) => {
    return res(ctx.json(mockQuestionnaire));
  }),

  rest.get(AppRest.ASSESSMENTS, (req, res, ctx) => {
    return res(ctx.json(mockAssessmentArray));
  }),

  rest.get(`${AppRest.ASSESSMENTS}/:assessmentId`, (req, res, ctx) => {
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
  rest.post(AppRest.ASSESSMENTS, (req, res, ctx) => {
    const newAssessmentId = generateNewAssessmentId();

    const newAssessment: Assessment = {
      id: newAssessmentId,
      status: "STARTED",
      name: "test",
      questionnaire: { id: 1, name: "Sample Questionnaire" },
      description: "Sample assessment description",
      risk: "AMBER",
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
      application: { id: 1, name: "App 1" },
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
  rest.patch(`${AppRest.ASSESSMENTS}/:assessmentId`, async (req, res, ctx) => {
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
];

export default handlers;
