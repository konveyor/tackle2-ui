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
} from "@patternfly/react-core";
import { HelpIcon } from "@patternfly/react-icons/dist/esm/icons/help-icon";

import { AppAboutModalState } from "../AppAboutModalState";
import { SSOMenu } from "./SSOMenu";
import { MobileDropdown } from "./MobileDropdown";

import navBrandImage from "@app/images/tackle.png";
import imgAvatar from "@app/images/avatar.svg";

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
                  id="aboutButton"
                  aria-label="about-button"
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
      <Avatar src={imgAvatar} alt="Avatar image" />
    </PageHeaderTools>
  );

  return (
    <PageHeader
      logo={<Brand src={navBrandImage} alt="brand" />}
      headerTools={toolbar}
      showNavToggle
    />
  );
};
