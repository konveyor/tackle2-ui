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

import useBranding from "@app/hooks/useBranding";
import { AppAboutModalState } from "../AppAboutModalState";
import { SSOMenu } from "./SSOMenu";
import { MobileDropdown } from "./MobileDropdown";

import "./header.css";

export const HeaderApp: React.FC = () => {
  const {
    masthead: { leftBrand, leftTitle, rightBrand },
  } = useBranding();

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
        {rightBrand ? (
          <ToolbarGroup>
            <ToolbarItem>
              <Brand
                src={rightBrand.src}
                alt={rightBrand.alt}
                heights={{ default: rightBrand.height }}
              />
            </ToolbarItem>
          </ToolbarGroup>
        ) : null}
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
          {leftBrand ? (
            <Brand
              src={leftBrand.src}
              alt={leftBrand.alt}
              heights={{ default: leftBrand.height }}
            />
          ) : null}
          {leftTitle ? (
            <Title
              className="logo-pointer"
              headingLevel={leftTitle?.heading ?? "h1"}
              size={leftTitle?.size ?? "2xl"}
            >
              {leftTitle.text}
            </Title>
          ) : null}
        </MastheadBrand>
      </MastheadMain>
      <MastheadContent>{toolbar}</MastheadContent>
    </Masthead>
  );
};
