// questionnaireData.ts

import type { Questionnaire } from "@app/api/models";

const questionnaireData: Record<number, Questionnaire> = {
  1: {
    id: 1,
    name: "System questionnaire",
    description: "This is a custom questionnaire",
    revision: 1,
    questions: 42,
    rating: "5% Red, 25% Yellow",
    createTime: "8 Aug. 2023, 10:20 AM EST",
    required: false,
    builtin: true,
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
                mitigation:
                  "Gathering more information about this is required.",
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
                mitigation:
                  "Gathering more information about this is required.",
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
      green: "Low Risk",
      red: "High Risk",
      yellow: "Medium Risk",
      unknown: "Low Risk",
    },
  },
  2: {
    id: 2,
    name: "Custom questionnaire",
    description: "This is a custom questionnaire",
    revision: 1,
    questions: 24,
    rating: "15% Red, 35% Yellow",
    createTime: "9 Aug. 2023, 03:32 PM EST",
    required: true,
    builtin: false,
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
                mitigation:
                  "Gathering more information about this is required.",
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
                mitigation:
                  "Gathering more information about this is required.",
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
      green: "Low Risk",
      red: "High Risk",
      yellow: "Medium Risk",
      unknown: "Low Risk",
    },
  },

  3: {
    id: 3,
    name: "Ruby questionnaire",
    description: "This is a ruby questionnaire",
    revision: 1,
    questions: 34,
    rating: "7% Red, 25% Yellow",
    createTime: "10 Aug. 2023, 11:23 PM EST",
    required: true,
    builtin: false,
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
        ],
      },
    ],
    thresholds: {
      red: 3,
      unknown: 2,
      yellow: 4,
    },
    riskMessages: {
      green: "Low Risk",
      red: "High Risk",
      yellow: "Medium Risk",
      unknown: "Low Risk",
    },
  },
};
export default questionnaireData;
