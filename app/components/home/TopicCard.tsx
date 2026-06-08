import { Link, useParams } from "react-router";
import { formatListDate } from "shared/dates";
import MemberProfileTrigger from "~/components/home/MemberProfileTrigger";
import api from "~/services/api";
import type { HomeTopic } from "~/types";
import ReactionBar from "./ReactionBar";

export default function TopicCard({ topic }: { topic: HomeTopic }) {
	const { mailboxId } = useParams<{ mailboxId: string }>();
	const topicPath = `/mailbox/${mailboxId}/feed/topics/${topic.id}`;
	const preview = topic.bodyText || topic.title;
	const thumb = topic.images[0];

	return (
		<article className="rounded-xl border border-kumo-line bg-kumo-base p-4 shadow-sm">
			<div className="flex items-start gap-3">
				<MemberProfileTrigger
					email={topic.authorEmail}
					avatarSize="md"
					showName={false}
					layout="avatar-only"
				/>
				<div className="min-w-0 flex-1">
					<div className="flex items-center justify-between gap-2">
						<MemberProfileTrigger
							email={topic.authorEmail}
							showName
							layout="name-only"
							nameClassName="font-semibold"
						/>
						<span className="text-xs text-kumo-subtle shrink-0">
							{formatListDate(topic.createdAt)}
						</span>
					</div>
					<Link
						to={topicPath}
						className="mt-1 block text-base font-semibold text-kumo-default hover:text-kumo-brand"
					>
						{topic.title}
					</Link>
					<p className="mt-1 text-sm text-kumo-subtle line-clamp-3">{preview}</p>
					{thumb && (
						<img
							src={api.homeTopicImageUrl(topic.id, thumb.id)}
							alt=""
							className="mt-3 max-h-48 w-full rounded-lg object-cover"
						/>
					)}
					<div className="mt-3 flex items-center justify-between gap-3">
						<ReactionBar topic={topic} />
						<Link
							to={topicPath}
							className="text-sm text-kumo-link hover:underline"
						>
							{topic.commentCount} comments
						</Link>
					</div>
				</div>
			</div>
		</article>
	);
}