import { Outlet } from "react-router";

// TODO(media): When feed items contain media attachments (videoId, imageIds),
// render VideoPlayer or Gallery components inline within feed cards.
// See components/VideoPlayer.tsx and components/Gallery.tsx for the rendering primitives.
// This will require extending the feed topic/comment data model to include
// media attachment references from the media pipeline.

export default function MailboxFeedLayoutRoute() {
	return (
		<div className="h-full overflow-y-auto bg-kumo-recessed">
			<div className="mx-auto max-w-3xl px-4 py-6">
				<Outlet />
			</div>
		</div>
	);
}