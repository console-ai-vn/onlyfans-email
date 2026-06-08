export const TRASH_RETENTION_DAYS = 30;
export const SENT_ARCHIVE_DAYS = 365;
export const RETENTION_BATCH_SIZE = 500;
export const RETENTION_ALARM_MS = 24 * 60 * 60 * 1000;

export interface RetentionPolicyOptions {
	trashDays?: number;
	sentDays?: number;
}

export function normalizeRetentionPolicyOptions(
	options: RetentionPolicyOptions = {},
): Required<RetentionPolicyOptions> {
	const trashDays = options.trashDays ?? TRASH_RETENTION_DAYS;
	const sentDays = options.sentDays ?? SENT_ARCHIVE_DAYS;
	if (!Number.isFinite(trashDays) || trashDays < 0 || trashDays > TRASH_RETENTION_DAYS) {
		throw new Error(`trashDays must be between 0 and ${TRASH_RETENTION_DAYS}`);
	}
	if (!Number.isFinite(sentDays) || sentDays < 0 || sentDays > SENT_ARCHIVE_DAYS) {
		throw new Error(`sentDays must be between 0 and ${SENT_ARCHIVE_DAYS}`);
	}
	return { trashDays, sentDays };
}

export function getRetentionCutoffs(now = Date.now(), options: RetentionPolicyOptions = {}) {
	const policy = normalizeRetentionPolicyOptions(options);
	return {
		trashCutoff: new Date(now - policy.trashDays * 24 * 60 * 60 * 1000).toISOString(),
		sentCutoff: new Date(now - policy.sentDays * 24 * 60 * 60 * 1000).toISOString(),
		trashDays: policy.trashDays,
		sentDays: policy.sentDays,
	};
}

export interface RetentionStats {
	trashTotal: number;
	sentTotal: number;
	trashEligible: number;
	sentEligible: number;
	trashCutoff: string;
	sentCutoff: string;
	trashDays: number;
	sentDays: number;
	testMode: boolean;
}

export interface RetentionRunResult {
	purgedCount: number;
	archivedCount: number;
	purgedEmailIds: string[];
	archivedEmailIds: string[];
	stats: RetentionStats;
}