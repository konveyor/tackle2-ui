# PatternFly v5 to v6 Token Migration Map

## Overview

18 tokens from `@patternfly/react-tokens` need updating across 8 files in tackle2-ui.
All tokens use the `.value` accessor (hex color strings). One token (`chart_color_green_100`)
is unchanged in v6 and requires no update.

## Token Mapping

| #   | Old v5 Token                | v6 Replacement                        | Old Hex   | v6 Hex    | Notes                                      |
| --- | --------------------------- | ------------------------------------- | --------- | --------- | ------------------------------------------ |
| 1   | `global_palette_black_1000` | `t_color_black`                       | `#000000` | `#000000` | Exact match                                |
| 2   | `global_palette_black_500`  | `t_color_gray_50`                     | `#8a8d90` | `#707070` | Closest gray                               |
| 3   | `global_palette_black_800`  | `t_color_gray_80`                     | `#292929` | `#292929` | Exact match                                |
| 4   | `global_palette_black_300`  | `t_color_gray_30`                     | `#d2d2d2` | `#c7c7c7` | Closest gray                               |
| 5   | `global_palette_blue_300`   | `t_global_color_nonstatus_blue_300`   | `#2b9af3` | `#4394e5` | Semantic equiv                             |
| 6   | `global_palette_cyan_300`   | `t_global_color_nonstatus_teal_300`   | `#009596` | `#63bdbd` | Cyan renamed to teal in v6                 |
| 7   | `global_palette_gold_300`   | `chart_color_yellow_200`              | `#f0ab00` | `#ffcc17` | No gold family in v6; closest chart yellow |
| 8   | `global_palette_green_300`  | `t_global_color_nonstatus_green_300`  | `#4cb140` | `#87bb62` | Semantic equiv                             |
| 9   | `global_palette_orange_300` | `t_global_color_nonstatus_orange_200` | `#f4b678` | `#f8ae54` | Closest orange                             |
| 10  | `global_palette_purple_600` | `t_color_purple_70`                   | `#1f0066` | `#21134d` | Closest dark purple                        |
| 11  | `global_palette_white`      | `t_color_white`                       | `#ffffff` | `#ffffff` | Exact match                                |
| 12  | `global_Color_dark_200`     | `t_global_text_color_200`             | `#6a6e73` | `#4d4d4d` | Semantic (secondary text)                  |
| 13  | `global_danger_color_100`   | `t_global_color_status_danger_100`    | `#c9190b` | `#b1380b` | Semantic equiv                             |
| 14  | `global_danger_color_200`   | `t_global_color_status_danger_200`    | `#a30000` | `#731f00` | Semantic equiv                             |
| 15  | `global_disabled_color_200` | `t_global_color_disabled_200`         | `#d2d2d2` | `#a3a3a3` | Semantic equiv                             |
| 16  | `global_info_color_100`     | `t_global_color_status_info_100`      | `#73bcf7` | `#5e40be` | Info changed blue to purple in v6          |
| 17  | `global_info_color_200`     | `t_global_color_status_info_200`      | `#2b9af3` | `#3d2785` | Info changed blue to purple in v6          |
| 18  | `global_success_color_100`  | `t_global_color_status_success_100`   | `#3e8635` | `#3d7317` | Semantic equiv                             |
| 19  | `chart_color_green_100`     | `chart_color_green_100` (unchanged)   | --        | --        | No change needed                           |

## Files to Update

### 1. `client/src/app/Constants.ts` (8 imports)

| Old Import                  | New Import                            | Alias    |
| --------------------------- | ------------------------------------- | -------- |
| `global_palette_black_1000` | `t_color_black`                       | `black`  |
| `global_palette_black_500`  | `t_color_gray_50`                     | `gray`   |
| `global_palette_blue_300`   | `t_global_color_nonstatus_blue_300`   | `blue`   |
| `global_palette_cyan_300`   | `t_global_color_nonstatus_teal_300`   | `cyan`   |
| `global_palette_gold_300`   | `chart_color_yellow_200`              | `gold`   |
| `global_palette_green_300`  | `t_global_color_nonstatus_green_300`  | `green`  |
| `global_palette_orange_300` | `t_global_color_nonstatus_orange_200` | `orange` |
| `global_palette_purple_600` | `t_color_purple_70`                   | `purple` |

### 2. `client/src/app/components/StatusIcon.tsx` (6 imports)

| Old Import                  | New Import                          | Alias           |
| --------------------------- | ----------------------------------- | --------------- |
| `global_Color_dark_200`     | `t_global_text_color_200`           | `unknownColor`  |
| `global_danger_color_100`   | `t_global_color_status_danger_100`  | `errorColor`    |
| `global_disabled_color_200` | `t_global_color_disabled_200`       | `disabledColor` |
| `global_info_color_100`     | `t_global_color_status_info_100`    | `infoColor`     |
| `global_info_color_200`     | `t_global_color_status_info_200`    | `loadingColor`  |
| `global_success_color_100`  | `t_global_color_status_success_100` | `successColor`  |

### 3. `client/src/app/components/StateError.tsx` (1 import)

| Old Import                | New Import                         | Alias                  |
| ------------------------- | ---------------------------------- | ---------------------- |
| `global_danger_color_200` | `t_global_color_status_danger_200` | `globalDangerColor200` |

### 4. `client/src/app/components/application-assessment-donut-chart/application-assessment-donut-chart.tsx` (1 import)

| Old Import                | New Import                          | Alias          |
| ------------------------- | ----------------------------------- | -------------- |
| `global_palette_blue_300` | `t_global_color_nonstatus_blue_300` | `defaultColor` |

### 5. `client/src/app/pages/review/components/application-assessment-donut-chart/application-assessment-donut-chart.tsx` (1 import)

| Old Import                | New Import                          | Alias          |
| ------------------------- | ----------------------------------- | -------------- |
| `global_palette_blue_300` | `t_global_color_nonstatus_blue_300` | `defaultColor` |

### 6. `client/src/app/pages/reports/components/adoption-candidate-graph/adoption-candidate-graph.tsx` (2 imports)

| Old Import                 | New Import        | Alias   |
| -------------------------- | ----------------- | ------- |
| `global_palette_black_800` | `t_color_gray_80` | `black` |
| `global_palette_white`     | `t_color_white`   | `white` |

Note: `chart_color_green_100` import is unchanged.

### 7. `client/src/app/pages/reports/components/adoption-candidate-graph/arrow.tsx` (1 import)

| Old Import                 | New Import        | Alias   |
| -------------------------- | ----------------- | ------- |
| `global_palette_black_800` | `t_color_gray_80` | `black` |

### 8. `client/src/app/pages/reports/components/donut/donut.tsx` (1 import)

| Old Import                 | New Import        | Alias   |
| -------------------------- | ----------------- | ------- |
| `global_palette_black_300` | `t_color_gray_30` | `black` |

## Notable Concerns

1. **Gold has no v6 token family** -- mapped to `chart_color_yellow_200` as the closest
   alternative within the token system.

2. **Info color changed semantics** -- PF v6 changed info from blue to purple. This affects
   `StatusIcon.tsx` for Canceled, Scheduled, and InProgress states. Decision: follow PF v6
   semantics (use the purple info tokens).

3. **Hex values shifted** -- Many v6 tokens have slightly different hex values than their v5
   counterparts. This is by design (PF v6 updated the color palette). The semantic equivalents
   are correct per PF's migration intent.
