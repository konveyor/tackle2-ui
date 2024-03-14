/* eslint-env node */

// Adapted from https://github.com/i18next/react-i18next/blob/master/example/test-jest/src/__mocks__/react-i18next.js
import React from "react";
import * as reactI18next from "react-i18next";

const hasChildren = (node) =>
  node && (node.children || (node.props && node.props.children));

const getChildren = (node) =>
  node && node.children ? node.children : node.props && node.props.children;

const renderNodes = (reactNodes) => {
  if (typeof reactNodes === "string") {
    return reactNodes;
  }

  return Object.keys(reactNodes).map((key, i) => {
    const child = reactNodes[key];
    const isElement = React.isValidElement(child);

    if (typeof child === "string") {
      return child;
    }
    if (hasChildren(child)) {
      const inner = renderNodes(getChildren(child));
      return React.cloneElement(child, { ...child.props, key: i }, inner);
    }
    if (typeof child === "object" && !isElement) {
      return Object.keys(child).reduce(
        (str, childKey) => `${str}${child[childKey]}`,
        ""
      );
    }

    return child;
  });
};

const useMock = [(k) => k, { changeLanguage: () => new Promise(() => {}) }];
useMock.t = (k) => k;
useMock.i18n = { changeLanguage: () => new Promise(() => {}) };

module.exports = {
  Trans: ({ children, i18nKey }) =>
    !children
      ? i18nKey
      : Array.isArray(children)
      ? renderNodes(children)
      : renderNodes([children]),

  Translation: ({ children }) => children((k) => k, { i18n: {} }),

  useTranslation: () => useMock,

  initReactI18next: {
    type: "3rdParty",
    init: () => {},
  },

  // mock if needed
  withTranslation: reactI18next.withTranslation,
  I18nextProvider: reactI18next.I18nextProvider,
  setDefaults: reactI18next.setDefaults,
  getDefaults: reactI18next.getDefaults,
  setI18n: reactI18next.setI18n,
  getI18n: reactI18next.getI18n,
};
