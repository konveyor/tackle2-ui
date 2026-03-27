import * as React from "react";
import {
  Brand,
  Button,
  ButtonVariant,
  Masthead,
  MastheadBrand,
  MastheadContent,
  MastheadLogo,
  MastheadMain,
  MastheadToggle,
  PageToggleButton,
  Title,
  Toolbar,
  ToolbarContent,
  ToolbarGroup,
  ToolbarItem,
} from "@patternfly/react-core";
import { BarsIcon, HelpIcon } from "@patternfly/react-icons";

import { TaskNotificationBadge } from "@app/components/task-manager/TaskNotificaitonBadge";
import { useBranding } from "@app/hooks/useBranding";

import { AppAboutModalState } from "../AppAboutModalState";

import { MobileDropdown } from "./MobileDropdown";
import { SsoToolbarItem } from "./SsoToolbarItem";

import "./header.css";

export const HeaderApp: React.FC = () => {
  const {
    masthead: { leftBrand, leftTitle, rightBrand },
  } = useBranding();

  const toolbar = (
    <Toolbar isFullHeight isStatic>
      <ToolbarContent>
        {/* toolbar items to always show */}
        <ToolbarGroup
          id="header-toolbar-tasks"
          variant="action-group-plain"
          align={{ default: "alignEnd" }}
        >
          <ToolbarItem>
            <TaskNotificationBadge />
          </ToolbarItem>
        </ToolbarGroup>

        {/* toolbar items to show at desktop sizes */}
        <ToolbarGroup
          id="header-toolbar-desktop"
          variant="action-group-plain"
          gap={{ default: "gapNone", md: "gapMd" }}
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
                    icon={<HelpIcon />}
                  />
                );
              }}
            </AppAboutModalState>
          </ToolbarItem>
        </ToolbarGroup>

        {/* toolbar items to show at mobile sizes */}
        <ToolbarGroup
          id="header-toolbar-mobile"
          variant="action-group-plain"
          gap={{ default: "gapNone", md: "gapMd" }}
          visibility={{ lg: "hidden" }}
        >
          <ToolbarItem>
            <MobileDropdown />
          </ToolbarItem>
        </ToolbarGroup>

        {/* Show the SSO menu at desktop sizes */}
        <ToolbarGroup
          id="header-toolbar-sso"
          visibility={{
            default: "hidden",
            md: "visible",
          }}
        >
          <SsoToolbarItem />
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
      <MastheadMain>
        <MastheadToggle>
          <PageToggleButton variant="plain" aria-label="Global navigation">
            <BarsIcon />
          </PageToggleButton>
        </MastheadToggle>
        <MastheadBrand>
          <MastheadLogo>
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
          </MastheadLogo>
        </MastheadBrand>
      </MastheadMain>
      <MastheadContent>{toolbar}</MastheadContent>
    </Masthead>
  );
};
