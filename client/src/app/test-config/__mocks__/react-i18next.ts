export const useTranslation = () => {
  return {
    t: (str: any) => str,
    i18n: {
      changeLanguage: () => new Promise(() => {}),
    },
  };
};
export const initReactI18next = {
  type: "3rdParty",
  init: jest.fn(),
};
