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

export const runIngestionPipeline = async (sourceTarget = "all:manual"): Promise<{
  result: IngestionResult;
  jobId: string;
}> => {
  const job = await repository.createCrawlJob(sourceTarget);

  try {
    const parsedEvents = await parseSources();
    const existing = await repository.listEvents();

    let created = 0;
    let updated = 0;

    for (const parsed of parsedEvents) {
      const matched = existing.find((item) => isSameByKey(parsed, item));
      if (!matched) {
        await repository.createEvent(parsed);
        created += 1;
        continue;
      }

      await repository.patchEvent(matched.id, {
        ...matched,
        title: parsed.title,
        start_date: parsed.start_date,
        end_date: parsed.end_date,
        date_precision: parsed.date_precision,
        is_estimated: parsed.is_estimated,
        estimation_basis: parsed.estimation_basis,
        confidence_score: Math.max(matched.confidence_score, parsed.confidence_score),
        sources: [...matched.sources, ...parsed.sources],
        verification_status: parsed.verification_status,
        last_verified_at: formatISO(new Date()),
      });

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
