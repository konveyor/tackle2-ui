import React, { FormEvent, useState } from "react";

import {
  DatePicker,
  InputGroup,
  isValidDate as isValidJSDate,
  ToolbarChip,
  ToolbarChipGroup,
  ToolbarFilter,
  Tooltip,
} from "@patternfly/react-core";

import { IFilterControlProps } from "./FilterControl";
import {
  localizeInterval,
  americanDateFormat,
  isValidAmericanShortDate,
  isValidInterval,
  parseAmericanDate,
  parseInterval,
  toISODateInterval,
} from "./dateUtils";

/**
 * This Filter type enables selecting an closed date range.
 * Precisely given range [A,B] a date X in the range if A <= X <= B.
 *
 * **Props are interpreted as follows**:<br>
 * 1) filterValue - date range encoded as ISO 8601 time interval string ("dateFrom/dateTo"). Only date part is used (no time).<br>
 * 2) setFilterValue - accepts the list of ranges.<br>
 *
 */
export const DateRangeFilter = <TItem,>({
  category,
  filterValue,
  setFilterValue,
  showToolbarItem,
  isDisabled = false,
}: IFilterControlProps<TItem, string>): JSX.Element | null => {
  const selectedFilters = filterValue ?? [];

  const validFilters =
    selectedFilters?.filter((interval) =>
      isValidInterval(parseInterval(interval))
    ) ?? [];
  const [from, setFrom] = useState<Date>();
  const [to, setTo] = useState<Date>();

  const rangeToOption = (range: string) => {
    const [abbrRange, fullRange] = localizeInterval(range);
    return {
      key: range,
      node: (
        <Tooltip content={fullRange ?? range}>
          <span>{abbrRange ?? ""}</span>
        </Tooltip>
      ),
    };
  };

  const clearSingleRange = (
    category: string | ToolbarChipGroup,
    option: string | ToolbarChip
  ) => {
    const target = (option as ToolbarChip)?.key;
    setFilterValue([...validFilters.filter((range) => range !== target)]);
  };

  const onFromDateChange = (
    event: FormEvent<HTMLInputElement>,
    value: string
  ) => {
    if (isValidAmericanShortDate(value)) {
      setFrom(parseAmericanDate(value));
      setTo(undefined);
    }
  };

  const onToDateChange = (even: FormEvent<HTMLInputElement>, value: string) => {
    if (isValidAmericanShortDate(value)) {
      const newTo = parseAmericanDate(value);
      setTo(newTo);
      const target = toISODateInterval(from, newTo);
      if (target) {
        setFilterValue([
          ...validFilters.filter((range) => range !== target),
          target,
        ]);
      }
    }
  };

  return (
    <ToolbarFilter
      key={category.categoryKey}
      chips={validFilters.map(rangeToOption)}
      deleteChip={clearSingleRange}
      deleteChipGroup={() => setFilterValue([])}
      categoryName={category.title}
      showToolbarItem={showToolbarItem}
    >
      <InputGroup>
        <DatePicker
          value={from ? americanDateFormat(from) : ""}
          dateFormat={americanDateFormat}
          dateParse={parseAmericanDate}
          onChange={onFromDateChange}
          aria-label="Interval start"
          placeholder="MM/DD/YYYY"
          // disable error text (no space in toolbar scenario)
          invalidFormatText={""}
          // default value ("parent") creates collision with sticky table header
          appendTo={document.body}
          isDisabled={isDisabled}
        />
        <DatePicker
          value={to ? americanDateFormat(to) : ""}
          onChange={onToDateChange}
          isDisabled={isDisabled || !isValidJSDate(from)}
          dateFormat={americanDateFormat}
          dateParse={parseAmericanDate}
          // disable error text (no space in toolbar scenario)
          invalidFormatText={""}
          rangeStart={from}
          aria-label="Interval end"
          placeholder="MM/DD/YYYY"
          appendTo={document.body}
        />
      </InputGroup>
    </ToolbarFilter>
  );
};
