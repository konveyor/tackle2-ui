import React from "react";
import { Link } from "react-router-dom";
import { Breadcrumb, BreadcrumbItem, Button } from "@patternfly/react-core";

export interface BreadCrumbPathProps {
  breadcrumbs: { title: string; path?: string | (() => void) }[];
}

export const BreadCrumbPath: React.FC<BreadCrumbPathProps> = ({
  breadcrumbs,
}) => {
  return (
    <Breadcrumb>
      {breadcrumbs.map((crumb, i, { length }) => {
        if (!crumb.path) {
          // the item is not a link
          return <BreadcrumbItem key={i}>{crumb.title}</BreadcrumbItem>;
        }

        const isLast = i === length - 1;

        const link =
          typeof crumb.path === "string" ? (
            <Link className="pf-v5-c-breadcrumb__link" to={crumb.path}>
              {crumb.title}
            </Link>
          ) : (
            <Button variant="link" isInline onClick={crumb.path}>
              {crumb.title}
            </Button>
          );

        return (
          <BreadcrumbItem key={i} isActive={isLast}>
            {isLast ? crumb.title : link}
          </BreadcrumbItem>
        );
      })}
    </Breadcrumb>
  );
};
