import * as React from "react";
import { NavLink } from "react-router-dom";

export interface HorizontalNavProps {
  navItems: { title: string; path: string }[];
}

export const HorizontalNav: React.FC<HorizontalNavProps> = ({ navItems }) => {
  return (
    <div className="pf-v5-c-tabs">
      <ul className="pf-v5-c-tabs__list">
        {navItems.map((f, index) => (
          <NavLink
            key={index}
            to={f.path}
            className="pf-v5-c-tabs__item"
            activeClassName="pf-m-current"
          >
            <li key={index} className="pf-v5-c-tabs__item">
              <button className="pf-v5-c-tabs__link">
                <span className="pf-v5-c-tabs__item-text">{f.title}</span>
              </button>
            </li>
          </NavLink>
        ))}
      </ul>
    </div>
  );
};
