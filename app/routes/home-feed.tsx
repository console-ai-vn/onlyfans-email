import { Button, Empty, Loader } from "@cloudflare/kumo";
import { GearIcon, PlusIcon } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useParams } from "react-router";
import CreateTopicSheet from "~/components/home/CreateTopicSheet";
import TopicCard from "~/components/home/TopicCard";
import { useHomeTopics } from "~/queries/home-feed";
import { queryKeys } from "~/queries/keys";
import api from "~/services/api";

export function meta() {
	return [{ title: "Feed — VSBG Box" }];
}

export default function HomeFeedRoute() {
	const { mailboxId } = useParams<{ mailboxId: string }>();
	const [page, setPage] = useState(1);
	const [showCreate, setShowCreate] = useState(false);
	const { data, isLoading, isError } = useHomeTopics(page);
	const { data: config } = useQuery({
		queryKey: queryKeys.config,
		queryFn: () => api.getConfig(),
		staleTime: 60_000,
	});
	const isAdmin = config?.isAdmin ?? false;

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
				title="Could not load feed"
				description="Refresh the page or check your access."
			/>
		);
	}

	const topics = data?.topics ?? [];

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between gap-3">
				<div>
					<h1 className="text-xl font-semibold text-kumo-default">Team feed</h1>
					<p className="text-sm text-kumo-subtle">
						Topics, comments, and reactions — separate from personal mail.
					</p>
				</div>
				<div className="flex items-center gap-2">
					{isAdmin && (
						<Link to={`/mailbox/${mailboxId}/feed/manage`}>
							<Button variant="secondary" size="sm" icon={<GearIcon size={16} />}>
								Manage
							</Button>
						</Link>
					)}
					<Button
						variant="primary"
						size="sm"
						icon={<PlusIcon size={16} />}
						onClick={() => setShowCreate(true)}
					>
						New topic
					</Button>
				</div>
			</div>

			{topics.length === 0 ? (
				<Empty
					title="No topics yet"
					description="Post the first topic for your team."
				/>
			) : (
				<div className="space-y-4">
					{topics.map((topic) => (
						<TopicCard key={topic.id} topic={topic} />
					))}
				</div>
			)}

			{data && data.totalCount > data.limit * page && (
				<div className="flex justify-center pt-2">
					<Button variant="secondary" size="sm" onClick={() => setPage((p) => p + 1)}>
						Load more
					</Button>
				</div>
			)}

			{showCreate && <CreateTopicSheet onClose={() => setShowCreate(false)} />}
		</div>
	);
}