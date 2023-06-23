export const FEATURES_ENABLED = {
  migrationWaves: true,
  dynamicReports: true,
};

if (process.env?.FEATURES_ENABLED) {
  const featureTuples = process.env?.FEATURES_ENABLED.split(",");
  featureTuples.forEach((tuple) => {
    const [key, val] = tuple.split(":");
    FEATURES_ENABLED[key as keyof typeof FEATURES_ENABLED] = val === "true";
  });
}
