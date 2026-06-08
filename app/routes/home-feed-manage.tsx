import { Button, Empty, Loader } from "@cloudflare/kumo";
import { ArrowLeftIcon, TrashIcon } from "@phosphor-icons/react";
import { useKumoToastManager } from "@cloudflare/kumo";
import { formatListDate } from "shared/dates";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link, Navigate, useParams } from "react-router";
import { useDeleteHomeTopic, useHomeTopics } from "~/queries/home-feed";
import { queryKeys } from "~/queries/keys";
import MemberProfileTrigger from "~/components/home/MemberProfileTrigger";
import api from "~/services/api";

export function meta() {
	return [{ title: "Manage feed — VSBG Box" }];
}

export default function HomeFeedManageRoute() {
	const { mailboxId } = useParams<{ mailboxId: string }>();
	const toast = useKumoToastManager();
	const [page, setPage] = useState(1);
	const { data: config, isLoading: configLoading } = useQuery({
		queryKey: queryKeys.config,
		queryFn: () => api.getConfig(),
		staleTime: 60_000,
	});
	const { data, isLoading, isError } = useHomeTopics(page, 50);
	const deleteTopic = useDeleteHomeTopic();
	const isAdmin = config?.isAdmin ?? false;

	if (configLoading) {
		return (
			<div className="flex justify-center py-16">
				<Loader />
			</div>
		);
	}

	if (!isAdmin) {
		return <Navigate to={`/mailbox/${mailboxId}/feed`} replace />;
	}

	if (isLoading) {
		return (
			<div className="flex justify-center py-16">
				<Loader />
			</div>
		);
	}

	if (isError) {
		return (
			<Empty
				title="Could not load topics"
				description="Refresh the page or check your access."
			/>
		);
	}

	const topics = data?.topics ?? [];

	const handleDeleteTopic = async (topicId: string, title: string) => {
		if (!window.confirm(`Delete topic "${title}" and all its comments?`)) return;
		try {
			await deleteTopic.mutateAsync(topicId);
			toast.add({ title: "Topic deleted" });
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "Could not delete topic";
			toast.add({ title: message, variant: "error" });
		}
	};

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between gap-3">
				<div>
					<Link to={`/mailbox/${mailboxId}/feed`}>
						<Button variant="ghost" size="sm" icon={<ArrowLeftIcon size={16} />}>
							Back to feed
						</Button>
					</Link>
					<h1 className="mt-2 text-xl font-semibold text-kumo-default">
						Manage feed
					</h1>
					<p className="text-sm text-kumo-subtle">
						Review and remove topics or comments that break team rules.
					</p>
				</div>
			</div>

			{topics.length === 0 ? (
				<Empty title="No topics" description="Nothing to moderate yet." />
			) : (
				<div className="overflow-hidden rounded-xl border border-kumo-line bg-kumo-base">
					<table className="w-full text-left text-sm">
						<thead className="border-b border-kumo-line bg-kumo-recessed text-xs uppercase tracking-wide text-kumo-subtle">
							<tr>
								<th className="px-4 py-3 font-semibold">Title</th>
								<th className="px-4 py-3 font-semibold">Author</th>
								<th className="px-4 py-3 font-semibold">Comments</th>
								<th className="px-4 py-3 font-semibold">Posted</th>
								<th className="px-4 py-3 font-semibold text-right">Actions</th>
							</tr>
						</thead>
						<tbody>
							{topics.map((topic) => (
								<tr key={topic.id} className="border-b border-kumo-line last:border-0">
									<td className="px-4 py-3 font-medium text-kumo-default">
										<Link
											to={`/mailbox/${mailboxId}/feed/topics/${topic.id}`}
											className="hover:text-kumo-brand"
										>
											{topic.title}
										</Link>
									</td>
									<td className="px-4 py-3 text-kumo-subtle">
										<MemberProfileTrigger
											email={topic.authorEmail}
											showName
											layout="name-only"
										/>
									</td>
									<td className="px-4 py-3 text-kumo-subtle">{topic.commentCount}</td>
									<td className="px-4 py-3 text-kumo-subtle">
										{formatListDate(topic.createdAt)}
									</td>
									<td className="px-4 py-3 text-right">
										<Button
											variant="ghost"
											shape="square"
											size="sm"
											icon={<TrashIcon size={16} />}
											loading={deleteTopic.isPending}
											onClick={() => void handleDeleteTopic(topic.id, topic.title)}
											aria-label={`Delete ${topic.title}`}
										/>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}

			{data && data.totalCount > data.limit * page && (
				<div className="flex justify-center pt-2">
					<Button variant="secondary" size="sm" onClick={() => setPage((p) => p + 1)}>
						Load more
					</Button>
				</div>
			)}
		</div>
	);
}