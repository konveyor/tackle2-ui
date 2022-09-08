export const buildHeadersWithHAL_JSON = (tokens: KcTokens) => {
  const headers = {
    "Content-Type": "application/json",
    Accept: "application/hal+json",
    Authorization: "Bearer " + tokens.access_token,
  };
  return headers;
};

export const buildHeadersWithJSON = (tokens: KcTokens) => {
  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
    Authorization: "Bearer " + tokens.access_token,
  };
  return headers;
};
