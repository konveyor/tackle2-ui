import React from "react";
import {
  Brand,
  Button,
  ButtonVariant,
  Masthead,
  MastheadBrand,
  MastheadContent,
  MastheadMain,
  MastheadToggle,
  PageToggleButton,
  Title,
  Toolbar,
  ToolbarContent,
  ToolbarGroup,
  ToolbarItem,
} from "@patternfly/react-core";
import HelpIcon from "@patternfly/react-icons/dist/esm/icons/help-icon";
import BarsIcon from "@patternfly/react-icons/dist/js/icons/bars-icon";
import { AppAboutModalState } from "../AppAboutModalState";
import { SSOMenu } from "./SSOMenu";
import { MobileDropdown } from "./MobileDropdown";

import konveyorBrandImage from "@app/images/Konveyor-white-logo.svg";
import { APP_BRAND, BrandType } from "@app/Constants";
import logoRedHat from "@app/images/logoRedHat.svg";
import "./header.css";

export const HeaderApp: React.FC = () => {
  const toolbar = (
    <Toolbar isFullHeight isStatic>
      <ToolbarContent>
        <ToolbarGroup
          variant="icon-button-group"
          align={{ default: "alignRight" }}
          spacer={{ default: "spacerNone", md: "spacerMd" }}
          visibility={{
            default: "hidden",
            "2xl": "visible",
            xl: "visible",
            lg: "visible",
            md: "hidden",
          }}
        >
          <ToolbarItem>
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
          </ToolbarItem>
        </ToolbarGroup>
        <ToolbarGroup>
          <ToolbarItem
            visibility={{
              lg: "hidden",
            }} /** this kebab dropdown replaces the icon buttons and is hidden for desktop sizes */
          >
            <MobileDropdown />
          </ToolbarItem>
          <SSOMenu />
        </ToolbarGroup>
        {APP_BRAND === BrandType.MTA && (
          <ToolbarGroup>
            <ToolbarItem>
              <img src={logoRedHat} alt="Logo" className="redhat-logo-style" />
            </ToolbarItem>
          </ToolbarGroup>
        )}
      </ToolbarContent>
    </Toolbar>
  );
  return (
    <Masthead>
      <MastheadToggle>
        <PageToggleButton variant="plain" aria-label="Global navigation">
          <BarsIcon />
        </PageToggleButton>
      </MastheadToggle>
      <MastheadMain>
        <MastheadBrand>
          {APP_BRAND === BrandType.Konveyor ? (
            <Brand
              src={konveyorBrandImage}
              alt="brand"
              heights={{ default: "60px" }}
            />
          ) : (
            <Title className="logo-pointer" headingLevel="h1" size="2xl">
              Migration Toolkit for Applications
            </Title>
          )}
        </MastheadBrand>
      </MastheadMain>
      <MastheadContent>{toolbar}</MastheadContent>
    </Masthead>
  );
};
