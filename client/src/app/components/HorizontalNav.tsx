import * as React from "react";
import classNames from "classnames";
import { Link, useMatch } from "react-router-dom";

export interface HorizontalNavProps {
  navItems: { title: string; path: string }[];
}

export const HorizontalNav: React.FC<HorizontalNavProps> = ({ navItems }) => {
  return (
    <div className="pf-v6-c-tabs">
      <ul className="pf-v6-c-tabs__list">
        {navItems.map((item) => (
          <HorizontalNavItem key={item.path} {...item} />
        ))}
      </ul>
    </div>
  );
};

const HorizontalNavItem = ({
  title,
  path,
}: {
  title: string;
  path: string;
}) => {
  const match = useMatch({ path, end: false });

  return (
    <li
      className={classNames("pf-v6-c-tabs__item", {
        "pf-m-current": match !== null,
      })}
    >
      <Link
        to={path}
        className="pf-v6-c-tabs__link"
        aria-current={match ? "page" : undefined}
      >
        <span className="pf-v6-c-tabs__item-text">{title}</span>
      </Link>
    </li>
  );
};
