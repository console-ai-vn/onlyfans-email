import { Badge, Button, Empty, Input, Loader, useKumoToastManager } from "@cloudflare/kumo";
import { ArrowCounterClockwiseIcon, ClipboardTextIcon } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import { useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuditLog, useRetentionStats, useRunRetention } from "~/queries/audit";
import api from "~/services/api";
import { queryKeys } from "~/queries/keys";

const ACTION_OPTIONS = [
	"",
	"email.read",
	"email.send",
	"email.delete",
	"email.move",
	"draft.save",
	"mailbox.create",
	"mailbox.settings_update",
	"conversation.state_update",
	"note.create",
	"retention.purge",
	"retention.archive",
	"mailbox.delete",
	"permission.grant",
	"permission.revoke",
	"domain.config_update",
] as const;

function formatTimestamp(value: string) {
	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? value : date.toLocaleString("vi-VN");
}

export default function AuditRoute() {
	const { mailboxId } = useParams<{ mailboxId: string }>();
	const toastManager = useKumoToastManager();
	const [page, setPage] = useState(1);
	const [action, setAction] = useState("");
	const [actor, setActor] = useState("");
	const [from, setFrom] = useState("");
	const [to, setTo] = useState("");

	const { data: config } = useQuery({
		queryKey: queryKeys.config,
		queryFn: () => api.getConfig(),
	});

	const params = useMemo(() => {
		const next: Record<string, string> = { page: String(page), limit: "50" };
		if (action) next.action = action;
		if (actor.trim()) next.actor = actor.trim();
		if (from) next.from = new Date(from).toISOString();
		if (to) next.to = new Date(to).toISOString();
		return next;
	}, [action, actor, from, page, to]);

	const isAdmin = config?.isAdmin ?? false;
	const { data, isLoading, isError, refetch, isFetching } = useAuditLog(mailboxId, params, {
		enabled: isAdmin,
	});
	const { data: retentionStats } = useRetentionStats(mailboxId, { enabled: isAdmin });
	const runRetention = useRunRetention();

	const formatCutoff = (value?: string) => {
		if (!value) return "—";
		const date = new Date(value);
		return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("vi-VN");
	};

	if (!config) {
		return (
			<div className="flex justify-center py-20">
				<Loader size="lg" />
			</div>
		);
	}

	if (!isAdmin) {
		return (
			<div className="max-w-2xl px-4 py-8 md:px-8">
				<Empty
					icon={<ClipboardTextIcon size={48} className="text-kumo-inactive" />}
					title="Admin only"
					description="Audit log is limited to privileged accounts in ACCESS_EMAIL_ADDRESSES."
				/>
			</div>
		);
	}

	const totalPages = data ? Math.max(1, Math.ceil(data.totalCount / data.limit)) : 1;

	const handleRunRetention = async (policy?: { trashDays?: number; sentDays?: number }) => {
		if (!mailboxId) return;
		try {
			const result = await runRetention.mutateAsync({ mailboxId, policy });
			const { stats } = result;
			const title =
				result.purgedCount === 0 && result.archivedCount === 0
					? "Retention chạy OK — không có mail đủ cũ để xử lý"
					: `Retention xong: ${result.purgedCount} xóa, ${result.archivedCount} archive`;
			toastManager.add({
				title,
				description:
					`Trash: ${stats.trashEligible}/${stats.trashTotal} mail >30 ngày · ` +
					`Sent: ${stats.sentEligible}/${stats.sentTotal} mail >365 ngày`,
			});
			await refetch();
		} catch {
			toastManager.add({ title: "Retention run failed", variant: "error" });
		}
	};

	return (
		<div className="h-full overflow-y-auto px-4 py-4 md:px-8 md:py-6">
			<div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-6">
				<div>
					<h1 className="text-lg font-semibold text-kumo-default">Audit log</h1>
					<p className="text-sm text-kumo-subtle mt-1">
						Immutable activity trail for this mailbox.
					</p>
				</div>
				<div className="flex flex-wrap items-center gap-2">
					<Button
						variant="secondary"
						icon={<ArrowCounterClockwiseIcon size={16} />}
						onClick={() => refetch()}
						disabled={isFetching}
					>
						Refresh
					</Button>
					<Button
						variant="primary"
						onClick={() => handleRunRetention()}
						disabled={runRetention.isPending}
					>
						Run retention (prod)
					</Button>
					<Button
						variant="secondary"
						onClick={() => handleRunRetention({ trashDays: 0 })}
						disabled={runRetention.isPending || (retentionStats?.trashTotal ?? 0) === 0}
					>
						Test: purge Trash now
					</Button>
				</div>
			</div>

			{retentionStats && (
				<div className="rounded-lg border border-kumo-line bg-kumo-recessed p-4 mb-4 text-sm text-kumo-subtle">
					<div className="font-medium text-kumo-default mb-2">Retention policy</div>
					<div className="grid gap-2 md:grid-cols-2">
						<p>
							Trash: xóa vĩnh viễn mail cũ hơn{" "}
							<strong>{formatCutoff(retentionStats.trashCutoff)}</strong>
							{" "}— hiện có{" "}
							<strong>{retentionStats.trashEligible}</strong>/{retentionStats.trashTotal} mail đủ điều kiện
						</p>
						<p>
							Sent: chuyển Archive mail cũ hơn{" "}
							<strong>{formatCutoff(retentionStats.sentCutoff)}</strong>
							{" "}— hiện có{" "}
							<strong>{retentionStats.sentEligible}</strong>/{retentionStats.sentTotal} mail đủ điều kiện
						</p>
					</div>
					{retentionStats.trashEligible === 0 && retentionStats.sentEligible === 0 && (
						<p className="mt-2 text-kumo-subtle">
							0 purged / 0 archived là bình thường khi hộp thư mới hoặc chưa có mail đủ cũ.
						</p>
					)}
				</div>
			)}

			<div className="grid gap-3 md:grid-cols-4 mb-4">
				<label className="text-sm text-kumo-subtle">
					Action
					<select
						className="mt-1 w-full rounded-md border border-kumo-line bg-kumo-base px-3 py-2 text-sm"
						value={action}
						onChange={(e) => {
							setPage(1);
							setAction(e.target.value);
						}}
					>
						<option value="">All</option>
						{ACTION_OPTIONS.filter(Boolean).map((item) => (
							<option key={item} value={item}>
								{item}
							</option>
						))}
					</select>
				</label>
				<Input
					label="Actor"
					placeholder="ceo@bdsmetro.com"
					value={actor}
					onChange={(e) => {
						setPage(1);
						setActor(e.target.value);
					}}
				/>
				<Input
					label="From"
					type="datetime-local"
					value={from}
					onChange={(e) => {
						setPage(1);
						setFrom(e.target.value);
					}}
				/>
				<Input
					label="To"
					type="datetime-local"
					value={to}
					onChange={(e) => {
						setPage(1);
						setTo(e.target.value);
					}}
				/>
			</div>

			{isLoading ? (
				<div className="flex justify-center py-16">
					<Loader size="lg" />
				</div>
			) : isError ? (
				<Empty
					title="Failed to load audit log"
					description="Check admin access and try again."
				/>
			) : !data || data.entries.length === 0 ? (
				<Empty
					icon={<ClipboardTextIcon size={48} className="text-kumo-inactive" />}
					title="No audit entries"
					description="Actions will appear here after mailbox activity."
				/>
			) : (
				<div className="rounded-lg border border-kumo-line overflow-hidden">
					<table className="w-full text-sm">
						<thead className="bg-kumo-recessed text-kumo-subtle">
							<tr>
								<th className="text-left px-4 py-3 font-medium">Time</th>
								<th className="text-left px-4 py-3 font-medium">Actor</th>
								<th className="text-left px-4 py-3 font-medium">Action</th>
								<th className="text-left px-4 py-3 font-medium">Target</th>
							</tr>
						</thead>
						<tbody>
							{data.entries.map((entry) => (
								<tr key={entry.id} className="border-t border-kumo-line">
									<td className="px-4 py-3 whitespace-nowrap text-kumo-subtle">
										{formatTimestamp(entry.created_at)}
									</td>
									<td className="px-4 py-3">{entry.actor_email}</td>
									<td className="px-4 py-3">
										<Badge variant="secondary">{entry.action}</Badge>
									</td>
									<td className="px-4 py-3 text-kumo-subtle">
										{entry.target_type}:{entry.target_id}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}

			{data && data.totalCount > 0 && (
				<div className="flex items-center justify-between mt-4">
					<span className="text-sm text-kumo-subtle">
						Page {data.page} / {totalPages} · {data.totalCount} entries
					</span>
					<div className="flex gap-2">
						<Button
							variant="secondary"
							disabled={page <= 1}
							onClick={() => setPage((current) => Math.max(1, current - 1))}
						>
							Previous
						</Button>
						<Button
							variant="secondary"
							disabled={page >= totalPages}
							onClick={() => setPage((current) => current + 1)}
						>
							Next
						</Button>
					</div>
				</div>
			)}
		</div>
	);
}