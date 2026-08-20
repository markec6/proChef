import {
  Edit3,
  PlusCircle,
  Printer,
  Trash2,
  type LucideIcon,
} from "lucide-react";

import type { ActivityAction, ActivityModule } from "@/types/database";

export const BELGRADE_TIME_ZONE = "Europe/Belgrade";

export type ActivityDatePreset =
  | "today"
  | "yesterday"
  | "last7"
  | "thisMonth"
  | "all";

export type ActivityFilters = {
  datePreset: ActivityDatePreset;
  userId: string | "all";
  module: ActivityModule | "all";
  action: ActivityAction | "all";
  search: string;
};

export const DEFAULT_ACTIVITY_FILTERS: ActivityFilters = {
  datePreset: "last7",
  userId: "all",
  module: "all",
  action: "all",
  search: "",
};

export const ACTIVITY_MODULES: ActivityModule[] = [
  "Magacin",
  "Jelovnik",
  "Specijalci",
  "Interna A",
  "I Hirurška",
  "Fakture",
];

export interface ActivityActionMeta {
  value: ActivityAction;
  label: string;
  filterLabel: string;
  icon: LucideIcon;
  className: string;
}

export const ACTIVITY_ACTIONS: Record<ActivityAction, ActivityActionMeta> = {
  CREATE: {
    value: "CREATE",
    label: "Dodato",
    filterLabel: "KREIRANO",
    icon: PlusCircle,
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  UPDATE: {
    value: "UPDATE",
    label: "Izmenjeno",
    filterLabel: "IZMENJENO",
    icon: Edit3,
    className: "border-amber-200 bg-amber-50 text-amber-800",
  },
  DELETE: {
    value: "DELETE",
    label: "Obrisano",
    filterLabel: "OBRISANO",
    icon: Trash2,
    className: "border-rose-200 bg-rose-50 text-rose-700",
  },
  PRINT: {
    value: "PRINT",
    label: "Odštampano",
    filterLabel: "ODŠTAMPANO",
    icon: Printer,
    className: "border-sky-200 bg-sky-50 text-sky-700",
  },
};

export const ACTIVITY_ACTION_OPTIONS: ActivityActionMeta[] = [
  ACTIVITY_ACTIONS.CREATE,
  ACTIVITY_ACTIONS.UPDATE,
  ACTIVITY_ACTIONS.DELETE,
  ACTIVITY_ACTIONS.PRINT,
];

export const ACTIVITY_DATE_PRESETS: Array<{
  value: ActivityDatePreset;
  label: string;
}> = [
  { value: "today", label: "Danas" },
  { value: "yesterday", label: "Juče" },
  { value: "last7", label: "Poslednjih 7 dana" },
  { value: "thisMonth", label: "Ovaj mesec" },
  { value: "all", label: "Svi datumi" },
];

export interface DateRange {
  from: Date;
  to: Date;
}

function getTimeZoneParts(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });

  const parts = Object.fromEntries(
    formatter
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value])
  );

  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second),
  };
}

function getTimeZoneOffsetMinutes(date: Date, timeZone: string) {
  const parts = getTimeZoneParts(date, timeZone);
  const asUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second
  );

  return (asUtc - date.getTime()) / 60_000;
}

function zonedDateTimeToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
  timeZone: string
) {
  const utcGuess = Date.UTC(year, month - 1, day, hour, minute, second);
  const offsetMinutes = getTimeZoneOffsetMinutes(new Date(utcGuess), timeZone);
  return new Date(utcGuess - offsetMinutes * 60_000);
}

function addCalendarDays(year: number, month: number, day: number, amount: number) {
  const utcDate = new Date(Date.UTC(year, month - 1, day + amount));
  return {
    year: utcDate.getUTCFullYear(),
    month: utcDate.getUTCMonth() + 1,
    day: utcDate.getUTCDate(),
  };
}

export function getBelgradeDayRange(date = new Date()): DateRange {
  const parts = getTimeZoneParts(date, BELGRADE_TIME_ZONE);

  return {
    from: zonedDateTimeToUtc(
      parts.year,
      parts.month,
      parts.day,
      0,
      0,
      0,
      BELGRADE_TIME_ZONE
    ),
    to: zonedDateTimeToUtc(
      parts.year,
      parts.month,
      parts.day,
      23,
      59,
      59,
      BELGRADE_TIME_ZONE
    ),
  };
}

export function getDateRangeForPreset(
  preset: ActivityDatePreset,
  now = new Date()
): DateRange | null {
  if (preset === "all") {
    return null;
  }

  const today = getTimeZoneParts(now, BELGRADE_TIME_ZONE);

  if (preset === "today") {
    return getBelgradeDayRange(now);
  }

  if (preset === "yesterday") {
    const yesterday = addCalendarDays(today.year, today.month, today.day, -1);
    return {
      from: zonedDateTimeToUtc(
        yesterday.year,
        yesterday.month,
        yesterday.day,
        0,
        0,
        0,
        BELGRADE_TIME_ZONE
      ),
      to: zonedDateTimeToUtc(
        yesterday.year,
        yesterday.month,
        yesterday.day,
        23,
        59,
        59,
        BELGRADE_TIME_ZONE
      ),
    };
  }

  if (preset === "last7") {
    const start = addCalendarDays(today.year, today.month, today.day, -6);
    return {
      from: zonedDateTimeToUtc(
        start.year,
        start.month,
        start.day,
        0,
        0,
        0,
        BELGRADE_TIME_ZONE
      ),
      to: zonedDateTimeToUtc(
        today.year,
        today.month,
        today.day,
        23,
        59,
        59,
        BELGRADE_TIME_ZONE
      ),
    };
  }

  return {
    from: zonedDateTimeToUtc(
      today.year,
      today.month,
      1,
      0,
      0,
      0,
      BELGRADE_TIME_ZONE
    ),
    to: zonedDateTimeToUtc(
      today.year,
      today.month,
      today.day,
      23,
      59,
      59,
      BELGRADE_TIME_ZONE
    ),
  };
}

export function isTimestampInRange(iso: string, range: DateRange) {
  const timestamp = new Date(iso).getTime();
  return timestamp >= range.from.getTime() && timestamp <= range.to.getTime();
}
