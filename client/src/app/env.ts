import { buildKonveyorEnv, decodeEnv } from "@konveyor-ui/common";

export const ENV = buildKonveyorEnv(decodeEnv(window._env));

export default ENV;
