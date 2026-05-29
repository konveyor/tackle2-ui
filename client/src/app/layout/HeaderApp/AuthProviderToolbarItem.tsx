import * as React from "react";

import { useAuth } from "@app/auth";

/**
 * Render the toolbar content for the active auth strategy.
 */
export const AuthProviderToolbarItem: React.FC = () => {
  const { ToolbarContent } = useAuth();
  return ToolbarContent ? <ToolbarContent /> : null;
};
