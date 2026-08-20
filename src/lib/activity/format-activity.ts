import { createClient } from "@/lib/supabase/client";
import type { DateRange } from "@/lib/constants/activity";
import type { ActivityLog } from "@/types/database";

type SupabaseBrowserClient = ReturnType<typeof createClient>;

const ACTIVITY_LOG_LIMIT = 500;

export function formatActivityTimestamp(iso: string) {
  const date = new Date(iso);
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Belgrade",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return `${get("day")}.${get("month")}.${get("year")}. u ${get("hour")}:${get("minute")}:${get("second")}`;
}

export type ActivityDetailSegment = {
  text: string;
  emphasize: boolean;
};

export function localizeActivityDetails(details: string) {
  const quantityChange = details.match(
    /^Quantity changed from (.+) to (.+) at (.+)$/i
  );

  if (quantityChange) {
    const location =
      quantityChange[3] === "unknown location"
        ? "nepoznata lokacija"
        : quantityChange[3];
    return `Količina promenjena sa ${quantityChange[1]} na ${quantityChange[2]} na lokaciji ${location}`;
  }

  const addedRow = details.match(/^Added row(?: in section (.+))?(?:: (.+))?$/i);
  if (addedRow) {
    const section = addedRow[1] ? ` u sekciji ${addedRow[1]}` : "";
    const row = addedRow[2] ? `: ${addedRow[2]}` : "";
    return `Dodat red${section}${row}`;
  }

  const deletedRow = details.match(
    /^Deleted row(?: in section (.+))?(?:: (.+))?$/i
  );
  if (deletedRow) {
    const section = deletedRow[1] ? ` u sekciji ${deletedRow[1]}` : "";
    const row = deletedRow[2] ? `: ${deletedRow[2]}` : "";
    return `Obrisan red${section}${row}`;
  }

  const cellChange = details.match(/^(.*) changed from "(.*)" to "(.*)"$/i);
  if (cellChange) {
    return `${cellChange[1]} promenjeno sa "${cellChange[2]}" na "${cellChange[3]}"`;
  }

  const printedOrder = details.match(/^Printed completed order(?: \((.*)\))?$/i);
  if (printedOrder) {
    if (!printedOrder[1]) {
      return "Odštampan popunjen nalog";
    }

    const printedParts = printedOrder[1]
      .replace(/\bdocument\b/gi, "broj")
      .replace(/\bdate\b/gi, "datum")
      .replace(/\bmeal\b/gi, "obrok");
    return `Odštampan popunjen nalog (${printedParts})`;
  }

  return details;
}

const DETAIL_EMPHASIS_PATTERN =
  /(\d+(?:[.,]\d+)?(?:\s*[A-Za-zČĆŽŠĐčćžšđ]+)?|➔|->|→)/g;

export function parseActivityDetails(details: string): ActivityDetailSegment[] {
  const localizedDetails = localizeActivityDetails(details);
  const segments: ActivityDetailSegment[] = [];
  let lastIndex = 0;

  for (const match of localizedDetails.matchAll(DETAIL_EMPHASIS_PATTERN)) {
    const matchedText = match[0];
    const start = match.index ?? 0;

    if (start > lastIndex) {
      segments.push({
        text: localizedDetails.slice(lastIndex, start),
        emphasize: false,
      });
    }

    segments.push({
      text: matchedText,
      emphasize: true,
    });
    lastIndex = start + matchedText.length;
  }

  if (lastIndex < localizedDetails.length) {
    segments.push({
      text: localizedDetails.slice(lastIndex),
      emphasize: false,
    });
  }

  return segments.length > 0
    ? segments
    : [{ text: localizedDetails, emphasize: false }];
}

export async function fetchActivityLogs(
  range: DateRange | null,
  supabase: SupabaseBrowserClient = createClient()
) {
  let query = supabase
    .from("activity_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(ACTIVITY_LOG_LIMIT);

  if (range) {
    query = query
      .gte("created_at", range.from.toISOString())
      .lte("created_at", range.to.toISOString());
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return (data ?? []) as ActivityLog[];
}

export async function deleteActivityLogs(
  ids: string[],
  supabase: SupabaseBrowserClient = createClient()
) {
  if (ids.length === 0) {
    return;
  }

  const { error } = await supabase.from("activity_logs").delete().in("id", ids);

  if (error) {
    throw error;
  }
}
