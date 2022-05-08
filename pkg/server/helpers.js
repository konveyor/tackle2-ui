/* eslint-disable @typescript-eslint/no-var-requires */

const TACKLE_ENV = [
  'NODE_ENV',
  'AUTH_REQUIRED',
  'KEYCLOAK_REALM',
  'KEYCLOAK_CLIENT_ID',
  'KEYCLOAK_SERVER_URL',
];

const getEnv = (vars = TACKLE_ENV) =>
  vars.reduce((newObj, varName) => ({ ...newObj, [varName]: process.env[varName] }), {});

const getEncodedEnv = () => Buffer.from(JSON.stringify(getEnv())).toString('base64');

module.exports = {
  getEnv,
  getEncodedEnv
};
