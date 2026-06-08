import {
	Badge,
	Button,
	Empty,
	Input,
	Loader,
	Select,
	useKumoToastManager,
} from "@cloudflare/kumo";
import { GlobeIcon, UsersIcon } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import {
	useDomainConfig,
	useGrantMailboxPermission,
	useMailboxPermissions,
	useRevokeMailboxPermission,
	useUpdateDomainConfig,
} from "~/queries/admin";
import api from "~/services/api";
import { queryKeys } from "~/queries/keys";

function linesToList(value: string) {
	return value
		.split("\n")
		.map((line) => line.trim())
		.filter(Boolean);
}

function listToLines(values: string[]) {
	return values.join("\n");
}

export default function AdminDomainsRoute() {
	const { mailboxId } = useParams<{ mailboxId: string }>();
	const toastManager = useKumoToastManager();
	const { data: config } = useQuery({
		queryKey: queryKeys.config,
		queryFn: () => api.getConfig(),
	});
	const isAdmin = config?.isAdmin ?? false;

	const { data: domainConfig, isLoading } = useDomainConfig({ enabled: isAdmin });
	const updateDomains = useUpdateDomainConfig();
	const { data: permissions = [] } = useMailboxPermissions(mailboxId, { enabled: isAdmin });
	const grantPermission = useGrantMailboxPermission(mailboxId);
	const revokePermission = useRevokeMailboxPermission(mailboxId);

	const [domainsText, setDomainsText] = useState("");
	const [emailAddressesText, setEmailAddressesText] = useState("");
	const [accessEmailsText, setAccessEmailsText] = useState("");
	const [grantEmail, setGrantEmail] = useState("");
	const [grantRole, setGrantRole] = useState<"manager" | "member" | "viewer">("member");

	useEffect(() => {
		if (!domainConfig) return;
		setDomainsText(listToLines(domainConfig.domains));
		setEmailAddressesText(listToLines(domainConfig.emailAddresses));
		setAccessEmailsText(listToLines(domainConfig.accessEmailAddresses));
	}, [domainConfig]);

	const handleSaveDomains = async () => {
		try {
			await updateDomains.mutateAsync({
				domains: linesToList(domainsText),
				emailAddresses: linesToList(emailAddressesText),
				accessEmailAddresses: linesToList(accessEmailsText),
			});
			toastManager.add({ title: "Domain config saved" });
		} catch {
			toastManager.add({ title: "Failed to save domain config", variant: "error" });
		}
	};

	const handleGrant = async () => {
		if (!grantEmail.trim()) return;
		try {
			await grantPermission.mutateAsync({
				userEmail: grantEmail.trim().toLowerCase(),
				role: grantRole,
			});
			setGrantEmail("");
			toastManager.add({ title: "Permission granted" });
		} catch {
			toastManager.add({ title: "Failed to grant permission", variant: "error" });
		}
	};

	const handleRevoke = async (userEmail: string) => {
		try {
			await revokePermission.mutateAsync(userEmail);
			toastManager.add({ title: "Permission revoked" });
		} catch {
			toastManager.add({ title: "Failed to revoke permission", variant: "error" });
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
					icon={<GlobeIcon size={48} className="text-kumo-inactive" />}
					title="Admin only"
					description="Domain management requires ACCESS_EMAIL_ADDRESSES membership."
				/>
			</div>
		);
	}

	if (isLoading || !domainConfig) {
		return (
			<div className="flex justify-center py-20">
				<Loader size="lg" />
			</div>
		);
	}

	return (
		<div className="max-w-3xl px-4 py-8 md:px-8 space-y-8">
			<div>
				<h1 className="text-xl font-semibold text-kumo-default">Admin</h1>
				<p className="text-sm text-kumo-subtle mt-1">
					Manage domains and mailbox permissions without redeploying.
				</p>
			</div>

			<section className="rounded-xl border border-kumo-line bg-kumo-base p-5 space-y-4">
				<h2 className="text-base font-semibold text-kumo-default">Domain config</h2>
				<p className="text-sm text-kumo-subtle">
					Stored in R2 at <code>domains/config.json</code>. Falls back to wrangler vars when missing.
				</p>
				<label className="block space-y-1.5">
					<span className="text-sm font-medium text-kumo-default">Domains (one per line)</span>
					<textarea
						className="w-full min-h-24 rounded-lg border border-kumo-line bg-kumo-recessed px-3 py-2 text-sm"
						value={domainsText}
						onChange={(e) => setDomainsText(e.target.value)}
					/>
				</label>
				<label className="block space-y-1.5">
					<span className="text-sm font-medium text-kumo-default">Mailbox addresses</span>
					<textarea
						className="w-full min-h-28 rounded-lg border border-kumo-line bg-kumo-recessed px-3 py-2 text-sm"
						value={emailAddressesText}
						onChange={(e) => setEmailAddressesText(e.target.value)}
					/>
				</label>
				<label className="block space-y-1.5">
					<span className="text-sm font-medium text-kumo-default">Admin access emails</span>
					<textarea
						className="w-full min-h-20 rounded-lg border border-kumo-line bg-kumo-recessed px-3 py-2 text-sm"
						value={accessEmailsText}
						onChange={(e) => setAccessEmailsText(e.target.value)}
					/>
				</label>
				<div className="flex justify-end">
					<Button
						variant="primary"
						size="sm"
						loading={updateDomains.isPending}
						onClick={handleSaveDomains}
					>
						Save domain config
					</Button>
				</div>
			</section>

			<section className="rounded-xl border border-kumo-line bg-kumo-base p-5 space-y-4">
				<div className="flex items-center gap-2">
					<UsersIcon size={20} />
					<h2 className="text-base font-semibold text-kumo-default">
						Mailbox permissions — {mailboxId}
					</h2>
				</div>
				<p className="text-sm text-kumo-subtle">
					Grant manager/member/viewer roles for this mailbox. Owner and global admin access still apply via CF Access.
				</p>

				<div className="flex flex-col gap-2 sm:flex-row sm:items-end">
					<Input
						label="User email"
						placeholder="user@company.com"
						size="sm"
						value={grantEmail}
						onChange={(e) => setGrantEmail(e.target.value)}
					/>
					<div className="min-w-36">
						<Select
							aria-label="Role"
							value={grantRole}
							onValueChange={(value) => {
								if (value === "manager" || value === "member" || value === "viewer") {
									setGrantRole(value);
								}
							}}
						>
							<Select.Option value="viewer">Viewer</Select.Option>
							<Select.Option value="member">Member</Select.Option>
							<Select.Option value="manager">Manager</Select.Option>
						</Select>
					</div>
					<Button
						variant="secondary"
						size="sm"
						loading={grantPermission.isPending}
						onClick={handleGrant}
					>
						Grant
					</Button>
				</div>

				{permissions.length === 0 ? (
					<p className="text-sm text-kumo-subtle">No explicit grants for this mailbox.</p>
				) : (
					<ul className="divide-y divide-kumo-line rounded-lg border border-kumo-line">
						{permissions.map((entry) => (
							<li
								key={entry.user_email}
								className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
							>
								<div>
									<div className="font-medium text-kumo-default">{entry.user_email}</div>
									<div className="text-kumo-subtle">
										Granted by {entry.granted_by} · {entry.granted_at}
									</div>
								</div>
								<div className="flex items-center gap-2">
									<Badge variant="secondary">{entry.role}</Badge>
									<Button
										variant="ghost"
										size="sm"
										onClick={() => handleRevoke(entry.user_email)}
										loading={revokePermission.isPending}
									>
										Revoke
									</Button>
								</div>
							</li>
						))}
					</ul>
				)}
			</section>
		</div>
	);
}