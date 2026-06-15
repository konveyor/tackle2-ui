import {
  chart_color_blue_200 as blue,
  chart_color_green_200 as green,
  chart_color_orange_200 as orange,
  chart_color_purple_200 as purple,
  chart_color_teal_300 as cyan,
  t_color_black as black,
} from "@patternfly/react-tokens";

import { EffortEstimate, ProposedAction, Risk } from "@app/api/models";

import { ENV } from "./env";

export const DEFAULT_REFETCH_INTERVAL = 5000;

export const isAuthRequired = ENV.AUTH_REQUIRED !== "false";
export const uploadLimit = ENV.UI_INGRESS_PROXY_BODY_SIZE || "500m";
export const isRWXSupported = ENV.RWX_SUPPORTED === "true";

export const isDevtoolsEnabled = ENV.DEVTOOLS === "on";

/**
 * The name of the client generated id field inserted in a object marked with mixin type
 * `WithUiId`.
 */
export const UI_UNIQUE_ID = "_ui_unique_id";

// Colors

// t('colors.red')
// t('colors.green')
// t('colors.gold')
// t('colors.blue')
// t('colors.orange')
// t('colors.purple')
// t('colors.cyan')
// t('colors.magenta')
// t('colors.lime')
// t('colors.teal')
// t('colors.brown')
// t('colors.maroon')
// t('colors.olive')
// t('colors.navy')
// t('colors.gray')
// t('colors.black')

const pv5_global_palette_black_1000 = "#030303";
const pv5_global_palette_blue_300 = "#2B9AF3";
const pv5_global_palette_cyan_300 = "#009596";
const pv5_global_palette_gold_300 = "#F4C145";
const pv5_global_palette_black_500 = "#8A8D90";
const pv5_global_palette_green_300 = "#6EC664";
const pv5_global_palette_orange_300 = "#EC7A08";
const pv5_global_palette_purple_600 = "#40199A";

// Colors from https://sashamaps.net/docs/resources/20-colors/ with some colors removed for being too bright
// and closest equivalent PF colors swapped in where applicable
export const COLOR_HEX_VALUES_BY_NAME = {
  red: "#d95f55", // (PF red is weird because 100 is too close to Maroon and 50 is too bright)
  green: pv5_global_palette_green_300,
  gold: pv5_global_palette_gold_300,
  blue: pv5_global_palette_blue_300,
  orange: pv5_global_palette_orange_300,
  purple: pv5_global_palette_purple_600,
  cyan: pv5_global_palette_cyan_300,
  magenta: "#f032e6",
  lime: "#bfef45",
  teal: "#469990",
  brown: "#9a6324",
  maroon: "#800000",
  olive: "#808000",
  navy: "#000075",
  gray: pv5_global_palette_black_500,
  black: pv5_global_palette_black_1000,
} as const;

/**
 * Expand shorthand hex (#abc) to full form (#aabbcc) so lookups work
 * regardless of which format the backend stored.
 */
export const normalizeHex = (hex: string): string => {
  const h = hex.toLowerCase().trim();
  if (/^#[0-9a-f]{3}$/.test(h)) {
    return `#${h[1]}${h[1]}${h[2]}${h[2]}${h[3]}${h[3]}`;
  }
  return h;
};

export const COLOR_NAMES_BY_HEX_VALUE: Record<
  string,
  keyof typeof COLOR_HEX_VALUES_BY_NAME | undefined
> = Object.fromEntries(
  Object.entries(COLOR_HEX_VALUES_BY_NAME).map(([name, hex]) => [
    normalizeHex(hex),
    name as keyof typeof COLOR_HEX_VALUES_BY_NAME,
  ])
);

// Risks
type RiskListType = {
  [key in Risk]: {
    i18Key: string;
    hexColor: string;
    labelColor:
      | "blue"
      | "teal"
      | "green"
      | "orange"
      | "purple"
      | "red"
      | "grey";
    sortFactor: number;
  };
};

// t('risks.low')
// t('risks.medium')
// t('risks.high')
// t('risks.unknown')

export const RISK_LIST: RiskListType = {
  green: {
    i18Key: "risks.low",
    hexColor: "#68b240",
    labelColor: "green",
    sortFactor: 1,
  },
  yellow: {
    i18Key: "risks.medium",
    hexColor: "#f0ab0b",
    labelColor: "orange",
    sortFactor: 2,
  },
  red: {
    i18Key: "risks.high",
    hexColor: "#cb440d",
    labelColor: "red",
    sortFactor: 3,
  },
  unknown: {
    i18Key: "risks.unknown",
    hexColor: black.value,
    labelColor: "grey",
    sortFactor: 4,
  },
  unassessed: {
    i18Key: "risks.unassessed",
    hexColor: black.value,
    labelColor: "grey",
    sortFactor: 5,
  },
};

// Proposed action
type ProposedActionListType = {
  [key in ProposedAction]: {
    i18Key: string;
    hexColor: string;
    labelColor:
      | "blue"
      | "teal"
      | "green"
      | "orange"
      | "purple"
      | "red"
      | "grey";
  };
};

// t('proposedActions.rehost')
// t('proposedActions.replatform')
// t('proposedActions.refactor')
// t('proposedActions.repurchase')
// t('proposedActions.retire')
// t('proposedActions.retain')

export const PROPOSED_ACTION_LIST: ProposedActionListType = {
  rehost: {
    i18Key: "proposedActions.rehost",
    labelColor: "green",
    hexColor: green.value,
  },
  replatform: {
    i18Key: "proposedActions.replatform",
    labelColor: "orange",
    hexColor: orange.value,
  },
  refactor: {
    i18Key: "proposedActions.refactor",
    labelColor: "red",
    hexColor: "#cb440d",
  },
  repurchase: {
    i18Key: "proposedActions.repurchase",
    labelColor: "purple",
    hexColor: purple.value,
  },
  retire: {
    i18Key: "proposedActions.retire",
    labelColor: "teal",
    hexColor: cyan.value,
  },
  retain: {
    i18Key: "proposedActions.retain",
    labelColor: "blue",
    hexColor: blue.value,
  },
};

// Effort
type EffortEstimateListType = {
  [key in EffortEstimate]: {
    i18Key: string;
    sortFactor: number;
    size: number;
  };
};

// t('efforts.small')
// t('efforts.medium')
// t('efforts.large')
// t('efforts.extraLarge')

export const EFFORT_ESTIMATE_LIST: EffortEstimateListType = {
  small: {
    i18Key: "efforts.small",
    sortFactor: 1,
    size: 10,
  },
  medium: {
    i18Key: "efforts.medium",
    sortFactor: 2,
    size: 20,
  },
  large: {
    i18Key: "efforts.large",
    sortFactor: 3,
    size: 30,
  },
  extra_large: {
    i18Key: "efforts.extraLarge",
    sortFactor: 4,
    size: 40,
  },
};

// Application toolbar

export enum LocalStorageKey {
  selectedPersona = "selectedPersona",
}

// URL param prefixes: should be short, must be unique for each table that uses one
export enum TablePersistenceKeyPrefix {
  dependencies = "d",
  issues = "i",
  issuesAffectedApps = "ia",
  issuesAffectedFiles = "if",
  issuesRemainingIncidents = "ii",
  insights = "in",
  insightsAffectedApps = "ina",
  insightsAffectedFiles = "inf",
  insightsRemainingIncidents = "ini",
  dependencyApplications = "da",
  archetypes = "ar",
  tasks = "t",
  platforms = "p",
  platformApplications = "pa",
  generatorCollections = "gc",
  generators = "g",
  migrators = "mi",
}
