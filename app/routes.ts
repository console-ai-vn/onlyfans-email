// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

import {
	index,
	type RouteConfig,
	route,
} from "@react-router/dev/routes";

export default [
	// ---- Public routes (no shell) ----
	index("routes/landing.tsx"),
	route("signup", "routes/signup.tsx"),
	route("checkout", "routes/checkout.tsx"),
	route("pricing", "routes/pricing.tsx"),

	// ---- Mobile tab navigation (wrapped in MobileShell) ----
	route("app", "routes/mobile-layout.tsx", [
		index("routes/tab-feed.tsx"),
		route("explore", "routes/tab-explore.tsx"),
		route("create", "routes/tab-create.tsx"),
		route("dm", "routes/tab-dm.tsx"),
		route("dm/:conversationId", "routes/dm.$conversationId.tsx"),
		route("profile", "routes/tab-profile.tsx"),
	]),

	// ---- Legacy mailbox routes (keep existing) ----
	route("home", "routes/home-redirect.tsx"),
	route("home/topics/:topicId", "routes/home-topic-redirect.tsx"),
	route("mailbox/:mailboxId", "routes/mailbox.tsx", [
		index("routes/mailbox-index.tsx"),
		route("feed", "routes/mailbox-feed-layout.tsx", [
			index("routes/home-feed.tsx"),
			route("manage", "routes/home-feed-manage.tsx"),
			route("topics/:topicId", "routes/home-topic.tsx"),
		]),
		route("emails/:folder", "routes/email-list.tsx"),
		route("settings", "routes/settings.tsx"),
		route("media", "routes/media.tsx"),
		route("audit", "routes/audit.tsx"),
		route("admin/domains", "routes/admin-domains.tsx"),
		route("admin/signups", "routes/admin-signup-queue.tsx"),
		route("search", "routes/search-results.tsx"),
	]),

	// ---- Creator profile ----
	route(":creatorId", "routes/creator.$creatorId.tsx"),

	// ---- Catch-all ----
	route("*", "routes/not-found.tsx"),
] satisfies RouteConfig;
