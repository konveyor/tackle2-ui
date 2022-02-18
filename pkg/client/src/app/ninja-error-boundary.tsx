import React from "react";
import {
  Bullseye,
  EmptyState,
  EmptyStateBody,
  EmptyStateIcon,
  EmptyStateVariant,
  Title,
} from "@patternfly/react-core";
import { UserNinjaIcon } from "@patternfly/react-icons/dist/esm/icons/user-ninja-icon";

interface NinjaErrorBoundaryProps {}
interface NinjaErrorBoundaryState {
  hasError: boolean;
}

export class NinjaErrorBoundary extends React.Component<
  NinjaErrorBoundaryProps,
  NinjaErrorBoundaryState
> {
  constructor(props: NinjaErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.log(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Bullseye>
          <EmptyState variant={EmptyStateVariant.small}>
            <EmptyStateIcon icon={UserNinjaIcon} />
            <Title headingLevel="h2" size="lg">
              Ops! Something went wrong.
            </Title>
            <EmptyStateBody>
              Try to refresh your page or contact your admin.
            </EmptyStateBody>
          </EmptyState>
        </Bullseye>
      );
    }

    return this.props.children;
  }
}
