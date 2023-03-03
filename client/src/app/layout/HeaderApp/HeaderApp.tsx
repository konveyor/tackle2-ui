import React from "react";
import {
  PageHeader,
  Brand,
  PageHeaderTools,
  Avatar,
  PageHeaderToolsGroup,
  PageHeaderToolsItem,
  Button,
  ButtonVariant,
  Title,
} from "@patternfly/react-core";
import HelpIcon from "@patternfly/react-icons/dist/esm/icons/help-icon";

import { AppAboutModalState } from "../AppAboutModalState";
import { SSOMenu } from "./SSOMenu";
import { MobileDropdown } from "./MobileDropdown";

import navBrandImage from "@app/images/konveyor-logo-white-text.png";
import { APP_BRAND, BrandType, isAuthRequired } from "@app/Constants";
import logoRedHat from "@app/images/logoRedHat.svg";
import "./header.css";

export const HeaderApp: React.FC = () => {
  const toolbar = (
    <PageHeaderTools>
      <PageHeaderToolsGroup
        visibility={{
          default: "hidden",
          "2xl": "visible",
          xl: "visible",
          lg: "visible",
          md: "hidden",
          sm: "hidden",
        }}
      >
        <PageHeaderToolsItem>
          <AppAboutModalState>
            {({ toggleModal }) => {
              return (
                <Button
                  id="about-button"
                  aria-label="about button"
                  variant={ButtonVariant.plain}
                  onClick={toggleModal}
                >
                  <HelpIcon />
                </Button>
              );
            }}
          </AppAboutModalState>
        </PageHeaderToolsItem>
      </PageHeaderToolsGroup>
      <PageHeaderToolsGroup>
        <PageHeaderToolsItem
          visibility={{
            lg: "hidden",
          }} /** this kebab dropdown replaces the icon buttons and is hidden for desktop sizes */
        >
          <MobileDropdown />
        </PageHeaderToolsItem>
        <SSOMenu />
      </PageHeaderToolsGroup>
      {APP_BRAND === BrandType.MTA && (
        <PageHeaderToolsGroup>
          <PageHeaderToolsItem>
            <img src={logoRedHat} alt="Logo" className="redhat-logo-style" />
          </PageHeaderToolsItem>
        </PageHeaderToolsGroup>
      )}
    </PageHeaderTools>
  );

  const headerLogo =
    APP_BRAND === BrandType.Konveyor ? (
      <Brand src={navBrandImage} alt="brand" />
    ) : (
      <Title className="logo-pointer" headingLevel="h1" size="2xl">
        Migration Toolkit for Applications
      </Title>
    );

  return <PageHeader logo={headerLogo} headerTools={toolbar} showNavToggle />;
};
