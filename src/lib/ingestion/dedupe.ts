import type { EventRecord } from "@/lib/types";

const normalize = (text: string) =>
  text
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[\-_/]/g, "");

const dateDistanceInDays = (a?: string | null, b?: string | null) => {
  if (!a || !b) {
    return Number.POSITIVE_INFINITY;
  }

  const ad = new Date(a).getTime();
  const bd = new Date(b).getTime();
  return Math.abs(ad - bd) / (1000 * 60 * 60 * 24);
};

export interface DuplicateCandidate {
  primary: EventRecord;
  duplicate: EventRecord;
  reason: string;
}

export const findDuplicateCandidates = (events: EventRecord[]) => {
  const candidates: DuplicateCandidate[] = [];

  for (let i = 0; i < events.length; i += 1) {
    for (let j = i + 1; j < events.length; j += 1) {
      const left = events[i];
      const right = events[j];

      if (left.brand_id !== right.brand_id) {
        continue;
      }

      const sameLink = left.sources.some((source) =>
        right.sources.some((target) => source.source_url === target.source_url),
      );

      const titleSimilarity =
        normalize(left.title).includes(normalize(right.title)) || normalize(right.title).includes(normalize(left.title));
      const dateNear = dateDistanceInDays(left.start_date, right.start_date) <= 7;

      if (sameLink || (titleSimilarity && dateNear)) {
        candidates.push({
          primary: left.confidence_score >= right.confidence_score ? left : right,
          duplicate: left.confidence_score >= right.confidence_score ? right : left,
          reason: sameLink ? "same-source-url" : "brand-title-date-similarity",
        });
      }
    }
  }

  return candidates;
};

export const pickCanonicalEvents = (events: EventRecord[]) => {
  const duplicates = findDuplicateCandidates(events);
  const duplicateIds = new Set(duplicates.map((item) => item.duplicate.id));
  return {
    canonical: events.filter((event) => !duplicateIds.has(event.id)),
    duplicates,
  };
};
