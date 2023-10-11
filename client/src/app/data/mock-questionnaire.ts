export const mockQuestionnaire = {
  id: 1,
  name: "Q1",
  description: "Questionnaire 1 ",
  revision: 1,
  questions: 42,
  rating: "5% Red, 25% Yellow",
  dateImported: "8 Aug. 2023, 10:20 AM EST",
  required: false,
  builtin: true,
  sections: [
    {
      name: "Application technologies 1",
      questions: [
        {
          formulation: "What is the main technology in your application?",
          explanation:
            "What would you describe as the main framework used to build your application.",
          answers: [
            {
              choice: "Unknown",
              rationale: "This is a problem because of the uncertainty.",
              mitigation: "Gathering more information about this is required.",
              risk: "unknown",
            },
            {
              choice: "Quarkus",
              risk: "green",
              autoanswer_if_tags_present: [
                {
                  category: {
                    name: "Cat 1",
                    id: 23,
                  },
                  id: 34,
                  name: "Tag 1",
                },
              ],
              autotag: [
                {
                  category: {
                    name: "Cat 1",
                    id: 23,
                  },
                  id: 34,
                  name: "Tag 1",
                },
              ],
            },
            {
              choice: "Spring Boot",
              risk: "green",
              autoanswer_if_tags_present: [
                {
                  category: {
                    name: "Cat 1",
                    id: 23,
                  },
                  id: 34,
                  name: "Tag 1",
                },
              ],
              autotag: [
                {
                  category: {
                    name: "Cat 1",
                    id: 23,
                  },
                  id: 34,
                  name: "Tag 1",
                },
              ],
            },
            {
              choice: "Java EE",
              rationale:
                "This might not be the most cloud friendly technology.",
              mitigation:
                "Maybe start thinking about migrating to Quarkus or Jakarta EE.",
              risk: "yellow",
              autoanswer_if_tags_present: [
                {
                  category: {
                    name: "Cat 1",
                    id: 23,
                  },
                  id: 34,
                  name: "Tag 1",
                },
              ],
              autotag: [
                {
                  category: {
                    name: "Cat 1",
                    id: 23,
                  },
                  id: 34,
                  name: "Tag 1",
                },
              ],
            },
            {
              choice: "J2EE",
              rationale: "This is obsolete.",
              mitigation:
                "Maybe start thinking about migrating to Quarkus or Jakarta EE.",
              risk: "red",
              autoanswer_if_tags_present: [
                {
                  category: {
                    name: "Cat 1",
                    id: 23,
                  },
                  id: 34,
                  name: "Tag 1",
                },
              ],
              autotag: [
                {
                  category: {
                    name: "Cat 1",
                    id: 23,
                  },
                  id: 34,
                  name: "Tag 1",
                },
              ],
            },
          ],
        },
        {
          formulation: "What version of Java EE does the application use?",
          explanation:
            "What version of the Java EE specification is your application using?",
          answers: [
            {
              choice: "Below 5.",
              rationale: "This technology stack is obsolete.",
              mitigation: "Consider migrating to at least Java EE 7.",
              risk: "red",
            },
            {
              choice: "5 or 6",
              rationale: "This is a mostly outdated stack.",
              mitigation: "Consider migrating to at least Java EE 7.",
              risk: "yellow",
            },
            {
              choice: "7",
              risk: "green",
            },
          ],
          include_if_tags_present: [
            {
              category: {
                name: "Cat 1",
                id: 23,
              },
              id: 34,
              name: "Tag 1",
            },
          ],
        },
        {
          formulation: "Does your application use any caching mechanism?",
          answers: [
            {
              choice: "Yes",
              rationale:
                "This could be problematic in containers and Kubernetes.",
              mitigation:
                "Review the clustering mechanism to check compatibility and support for container environments.",
              risk: "yellow",
              autoanswer_if_tags_present: [
                {
                  category: {
                    name: "Cat 1",
                    id: 23,
                  },
                  id: 34,
                  name: "Tag 1",
                },
              ],
            },
            {
              choice: "No",
              risk: "green",
            },
            {
              choice: "Unknown",
              rationale: "This is a problem because of the uncertainty.",
              mitigation: "Gathering more information about this is required.",
              risk: "unknown",
            },
          ],
        },
        {
          formulation:
            "What implementation of JAX-WS does your application use?",
          answers: [
            {
              choice: "Apache Axis",
              rationale: "This version is obsolete",
              mitigation: "Consider migrating to Apache CXF",
              risk: "red",
            },
            {
              choice: "Apache CXF",
              risk: "green",
            },
            {
              choice: "Unknown",
              rationale: "This is a problem because of the uncertainty.",
              mitigation: "Gathering more information about this is required.",
              risk: "unknown",
            },
          ],
          skip_if_tags_present: [
            {
              category: {
                name: "Cat 1",
                id: 23,
              },
              id: 34,
              name: "Tag 1",
            },
          ],
        },
      ],
    },
    {
      name: "Application technologies",
      questions: [
        {
          formulation: "What is the main technology in your application?",
          explanation:
            "What would you describe as the main framework used to build your application.",
          answers: [
            {
              choice: "Unknown",
              rationale: "This is a problem because of the uncertainty.",
              mitigation: "Gathering more information about this is required.",
              risk: "unknown",
            },
            {
              choice: "Quarkus",
              risk: "green",
              autoanswer_if_tags_present: [
                {
                  category: {
                    name: "Cat 1",
                    id: 23,
                  },
                  id: 34,
                  name: "Tag 1",
                },
              ],
              autotag: [
                {
                  category: {
                    name: "Cat 1",
                    id: 23,
                  },
                  id: 34,
                  name: "Tag 1",
                },
              ],
            },
            {
              choice: "Spring Boot",
              risk: "green",
              autoanswer_if_tags_present: [
                {
                  category: {
                    name: "Cat 1",
                    id: 23,
                  },
                  id: 34,
                  name: "Tag 1",
                },
              ],
              autotag: [
                {
                  category: {
                    name: "Cat 1",
                    id: 23,
                  },
                  id: 34,
                  name: "Tag 1",
                },
              ],
            },
            {
              choice: "Java EE",
              rationale:
                "This might not be the most cloud friendly technology.",
              mitigation:
                "Maybe start thinking about migrating to Quarkus or Jakarta EE.",
              risk: "yellow",
              autoanswer_if_tags_present: [
                {
                  category: {
                    name: "Cat 1",
                    id: 23,
                  },
                  id: 34,
                  name: "Tag 1",
                },
              ],
              autotag: [
                {
                  category: {
                    name: "Cat 1",
                    id: 23,
                  },
                  id: 34,
                  name: "Tag 1",
                },
              ],
            },
            {
              choice: "J2EE",
              rationale: "This is obsolete.",
              mitigation:
                "Maybe start thinking about migrating to Quarkus or Jakarta EE.",
              risk: "red",
              autoanswer_if_tags_present: [
                {
                  category: {
                    name: "Cat 1",
                    id: 23,
                  },
                  id: 34,
                  name: "Tag 1",
                },
              ],
              autotag: [
                {
                  category: {
                    name: "Cat 1",
                    id: 23,
                  },
                  id: 34,
                  name: "Tag 1",
                },
              ],
            },
          ],
        },
        {
          formulation: "What version of Java EE does the application use?",
          explanation:
            "What version of the Java EE specification is your application using?",
          answers: [
            {
              choice: "Below 5.",
              rationale: "This technology stack is obsolete.",
              mitigation: "Consider migrating to at least Java EE 7.",
              risk: "red",
            },
            {
              choice: "5 or 6",
              rationale: "This is a mostly outdated stack.",
              mitigation: "Consider migrating to at least Java EE 7.",
              risk: "yellow",
            },
            {
              choice: "7",
              risk: "green",
            },
          ],
          include_if_tags_present: [
            {
              category: {
                name: "Cat 1",
                id: 23,
              },
              id: 34,
              name: "Tag 1",
            },
          ],
        },
        {
          formulation: "Does your application use any caching mechanism?",
          answers: [
            {
              choice: "Yes",
              rationale:
                "This could be problematic in containers and Kubernetes.",
              mitigation:
                "Review the clustering mechanism to check compatibility and support for container environments.",
              risk: "yellow",
              autoanswer_if_tags_present: [
                {
                  category: {
                    name: "Cat 1",
                    id: 23,
                  },
                  id: 34,
                  name: "Tag 1",
                },
              ],
            },
            {
              choice: "No",
              risk: "green",
            },
            {
              choice: "Unknown",
              rationale: "This is a problem because of the uncertainty.",
              mitigation: "Gathering more information about this is required.",
              risk: "unknown",
            },
          ],
        },
        {
          formulation:
            "What implementation of JAX-WS does your application use?",
          answers: [
            {
              choice: "Apache Axis",
              rationale: "This version is obsolete",
              mitigation: "Consider migrating to Apache CXF",
              risk: "red",
            },
            {
              choice: "Apache CXF",
              risk: "green",
            },
            {
              choice: "Unknown",
              rationale: "This is a problem because of the uncertainty.",
              mitigation: "Gathering more information about this is required.",
              risk: "unknown",
            },
          ],
          skip_if_tags_present: [
            {
              category: {
                name: "Cat 1",
                id: 23,
              },
              id: 34,
              name: "Tag 1",
            },
            {
              category: {
                name: "Cat 2",
                id: 23,
              },
              id: 34,
              name: "Tag 2",
            },
          ],
        },
      ],
    },
  ],
  thresholds: { red: "5", yellow: "25", unknown: "70" },
  riskMessages: {
    green: "Low Risk",
    red: "High Risk",
    yellow: "Medium Risk",
    unknown: "Low Risk",
  },
};
