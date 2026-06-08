import {
	Badge,
	Button,
	Empty,
	Input,
	Loader,
	useKumoToastManager,
} from "@cloudflare/kumo";
import { CheckCircleIcon, ClipboardTextIcon, UserPlusIcon } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { formatListDate } from "shared/dates";
import { useApproveSignupRequest, useSignupRequests } from "~/queries/admin";
import api from "~/services/api";
import { queryKeys } from "~/queries/keys";

function statusBadge(status: "pending" | "approved" | "rejected") {
	if (status === "approved") return <Badge variant="success">Approved</Badge>;
	if (status === "rejected") return <Badge variant="secondary">Rejected</Badge>;
	return <Badge variant="outline">Pending</Badge>;
}

export default function AdminSignupQueueRoute() {
	const { mailboxId } = useParams<{ mailboxId: string }>();
	const toast = useKumoToastManager();
	const { data: config } = useQuery({
		queryKey: queryKeys.config,
		queryFn: () => api.getConfig(),
	});
	const isAdmin = config?.isAdmin ?? false;
	const { data: requests = [], isLoading, refetch, isFetching } = useSignupRequests({
		enabled: isAdmin,
	});
	const approveRequest = useApproveSignupRequest();
	const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});
	const [lastReminder, setLastReminder] = useState("");

	const pending = useMemo(
		() => requests.filter((entry) => entry.status === "pending"),
		[requests],
	);
	const processed = useMemo(
		() => requests.filter((entry) => entry.status !== "pending"),
		[requests],
	);

	const handleApprove = async (requestId: string) => {
		try {
			const result = await approveRequest.mutateAsync({
				requestId,
				adminNote: adminNotes[requestId]?.trim(),
			});
			setLastReminder(result.accessReminder);
			setAdminNotes((current) => {
				const next = { ...current };
				delete next[requestId];
				return next;
			});
			toast.add({
				title: "Signup approved",
				description: result.mailboxCreated
					? "Mailbox created and allowlist updated."
					: "Allowlist and permissions updated.",
			});
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "Could not approve signup";
			toast.add({ title: message, variant: "error" });
		}
	};

	const copyReminder = async (text: string) => {
		try {
			await navigator.clipboard.writeText(text);
			toast.add({ title: "Copied Access reminder" });
		} catch {
			toast.add({ title: "Could not copy", variant: "error" });
		}
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
					icon={<UserPlusIcon size={48} className="text-kumo-inactive" />}
					title="Admin only"
					description="Signup queue requires ACCESS_EMAIL_ADDRESSES membership."
				/>
			</div>
		);
	}

	return (
		<div className="max-w-4xl px-4 py-8 md:px-8 space-y-6">
			<div className="flex flex-wrap items-start justify-between gap-3">
				<div>
					<h1 className="text-xl font-semibold text-kumo-default">Signup queue</h1>
					<p className="mt-1 text-sm text-kumo-subtle">
						Duyệt yêu cầu từ start.vsbg.vn — 1 click tạo mailbox + grant member.
					</p>
				</div>
				<div className="flex items-center gap-2">
					<Link to={`/mailbox/${mailboxId}/admin/domains`}>
						<Button variant="secondary" size="sm">
							Domain admin
						</Button>
					</Link>
					<Button
						variant="ghost"
						size="sm"
						loading={isFetching}
						onClick={() => void refetch()}
					>
						Refresh
					</Button>
				</div>
			</div>

			{lastReminder && (
				<div className="rounded-xl border border-amber-300/40 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
					<div className="font-semibold">Bước cuối — Cloudflare Access OTP</div>
					<p className="mt-1">{lastReminder}</p>
					<Button
						variant="secondary"
						size="sm"
						className="mt-3"
						icon={<ClipboardTextIcon size={14} />}
						onClick={() => void copyReminder(lastReminder)}
					>
						Copy reminder
					</Button>
				</div>
			)}

			{isLoading ? (
				<div className="flex justify-center py-16">
					<Loader />
				</div>
			) : requests.length === 0 ? (
				<Empty
					icon={<UserPlusIcon size={48} className="text-kumo-inactive" />}
					title="No signup requests"
					description="New requests from the public landing form will appear here."
				/>
			) : (
				<div className="space-y-8">
					<section className="space-y-3">
						<h2 className="text-base font-semibold text-kumo-default">
							Pending ({pending.length})
						</h2>
						{pending.length === 0 ? (
							<p className="text-sm text-kumo-subtle">Không có request chờ duyệt.</p>
						) : (
							<div className="space-y-3">
								{pending.map((entry) => (
									<article
										key={entry.id}
										className="rounded-xl border border-kumo-line bg-kumo-base p-4 shadow-sm"
									>
										<div className="flex flex-wrap items-start justify-between gap-3">
											<div>
												<div className="flex flex-wrap items-center gap-2">
													<h3 className="text-base font-semibold text-kumo-default">
														{entry.displayName}
													</h3>
													{statusBadge(entry.status)}
												</div>
												<p className="mt-1 text-sm text-kumo-subtle">
													{formatListDate(entry.createdAt)}
												</p>
											</div>
											<Button
												variant="primary"
												size="sm"
												icon={<CheckCircleIcon size={16} />}
												loading={approveRequest.isPending}
												onClick={() => void handleApprove(entry.id)}
											>
												Approve
											</Button>
										</div>
										<dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
											<div>
												<dt className="text-kumo-subtle">Mailbox</dt>
												<dd className="font-medium text-kumo-default">
													{entry.desiredMailbox}
												</dd>
											</div>
											<div>
												<dt className="text-kumo-subtle">OTP email</dt>
												<dd className="font-medium text-kumo-default">
													{entry.personalEmail}
												</dd>
											</div>
										</dl>
										{entry.note && (
											<p className="mt-3 rounded-lg bg-kumo-recessed px-3 py-2 text-sm text-kumo-strong">
												{entry.note}
											</p>
										)}
										<div className="mt-4">
											<Input
												label="Admin note (optional)"
												size="sm"
												placeholder="Đã cấp OTP, role member..."
												value={adminNotes[entry.id] ?? ""}
												onChange={(e) =>
													setAdminNotes((current) => ({
														...current,
														[entry.id]: e.target.value,
													}))
												}
											/>
										</div>
									</article>
								))}
							</div>
						)}
					</section>

					{processed.length > 0 && (
						<section className="space-y-3">
							<h2 className="text-base font-semibold text-kumo-default">Processed</h2>
							<ul className="divide-y divide-kumo-line rounded-xl border border-kumo-line bg-kumo-base">
								{processed.map((entry) => (
									<li key={entry.id} className="px-4 py-3 text-sm">
										<div className="flex flex-wrap items-center gap-2">
											<span className="font-medium text-kumo-default">
												{entry.displayName}
											</span>
											{statusBadge(entry.status)}
										</div>
										<div className="mt-1 text-kumo-subtle">
											{entry.desiredMailbox} · OTP {entry.personalEmail}
										</div>
										{entry.adminNote && (
											<div className="mt-1 text-kumo-strong">{entry.adminNote}</div>
										)}
									</li>
								))}
							</ul>
						</section>
					)}
				</div>
			)}
		</div>
	);
}