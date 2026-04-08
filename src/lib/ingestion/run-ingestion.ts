import { formatISO } from "date-fns";

import { findDuplicateCandidates } from "@/lib/ingestion/dedupe";
import { parseSources } from "@/lib/ingestion/parser";
import { repository } from "@/lib/repositories/repository";
import type { EventRecord, IngestionResult } from "@/lib/types";

const isSameByKey = (incoming: EventRecord, existing: EventRecord) => {
  const sameBrand = incoming.brand_id === existing.brand_id;
  const sameSlug = incoming.slug && existing.slug && incoming.slug === existing.slug;
  const similarTitle = incoming.title.replace(/\s+/g, "") === existing.title.replace(/\s+/g, "");
  const nearbyDate = incoming.start_date && existing.start_date && incoming.start_date.slice(0, 7) === existing.start_date.slice(0, 7);

  return sameBrand && (sameSlug || (similarTitle && nearbyDate));
};

const reliabilityRank = (event: EventRecord) => {
  let score = 0;

  if (event.announcement_status === "official") {
    score += 2;
  }

  if (event.verification_status === "verified") {
    score += 2;
  }

  if (!event.is_estimated) {
    score += 1;
  }

  return score;
};

const mergeSourcesUnique = (left: EventRecord["sources"], right: EventRecord["sources"]) => {
  const seen = new Set<string>();
  const merged = [...left, ...right].filter((source) => {
    const key = `${source.source_url}|${source.parsed_start_date ?? ""}|${source.parsed_end_date ?? ""}|${source.raw_excerpt ?? ""}`;
    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });

  return merged;
};

export const runIngestionPipeline = async (sourceTarget = "all:manual"): Promise<{
  result: IngestionResult;
  jobId: string;
}> => {
  const job = await repository.createCrawlJob(sourceTarget);

  try {
    const existing = await repository.listEvents();
    const parsedEvents = await parseSources(existing);

    let created = 0;
    let updated = 0;

    for (const parsed of parsedEvents) {
      const matchedIndex = existing.findIndex((item) => isSameByKey(parsed, item));
      const matched = matchedIndex >= 0 ? existing[matchedIndex] : null;

      if (!matched) {
        const createdEvent = await repository.createEvent(parsed);
        existing.push(createdEvent);
        created += 1;
        continue;
      }

      const shouldUseParsed =
        parsed.announcement_status === "official" || reliabilityRank(parsed) >= reliabilityRank(matched);
      const preferred = shouldUseParsed ? parsed : matched;

      const patched = await repository.patchEvent(matched.id, {
        ...matched,
        title: preferred.title,
        description: preferred.description,
        event_type: preferred.event_type,
        start_date: preferred.start_date,
        end_date: preferred.end_date,
        date_precision: preferred.date_precision,
        is_estimated: preferred.is_estimated,
        estimation_basis: preferred.estimation_basis,
        recurrence_pattern: preferred.recurrence_pattern,
        confidence_score: Math.max(matched.confidence_score, parsed.confidence_score),
        sources: mergeSourcesUnique(matched.sources, parsed.sources),
        verification_status: preferred.verification_status,
        announcement_status: preferred.announcement_status,
        last_verified_at: formatISO(new Date()),
      });

      if (patched) {
        existing[matchedIndex] = patched;
      }
      updated += 1;
    }

    const refreshed = await repository.listEvents();
    const duplicates = findDuplicateCandidates(refreshed);

    for (const duplicate of duplicates) {
      await repository.mergeEvents(duplicate.primary.id, duplicate.duplicate.id);
    }

    const result: IngestionResult = {
      crawled: parsedEvents.length,
      merged: duplicates.length,
      created,
      updated,
      failed: 0,
      duplicateCandidates: duplicates.map((item) => ({
        primaryId: item.primary.id,
        duplicateId: item.duplicate.id,
        reason: item.reason,
      })),
    };

    await repository.finishCrawlJob(job.id, {
      status: "completed",
      items_found: parsedEvents.length,
      errors_count: 0,
      log_blob: JSON.stringify(result, null, 2),
      finished_at: formatISO(new Date()),
    });

    return { result, jobId: job.id };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    await repository.finishCrawlJob(job.id, {
      status: "failed",
      items_found: 0,
      errors_count: 1,
      log_blob: errorMessage,
      finished_at: formatISO(new Date()),
    });

    return {
      jobId: job.id,
      result: {
        crawled: 0,
        merged: 0,
        created: 0,
        updated: 0,
        failed: 1,
        duplicateCandidates: [],
      },
    };
  }
};
