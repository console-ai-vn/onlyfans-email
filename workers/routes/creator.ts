import { Hono } from "hono"
import type { AccessVariables, Env } from "../types"

type CreatorContext = {
	Bindings: Env
	Variables: AccessVariables
}

const app = new Hono<CreatorContext>()

// GET /api/v1/creator/top — featured creators list (public)
app.get("/api/v1/creator/top", async (c) => {
	try {
		const configKey = "domains.json"
		const obj = await c.env.BUCKET.get(configKey)
		if (!obj) return c.json({ creators: [] })

		const config = (await obj.json()) as {
			emailAddresses?: string[]
		}
		const emails = (config.emailAddresses ?? []).slice(0, 20)

		const creators: Array<Record<string, unknown>> = []
		for (const email of emails) {
			const mailboxKey = `mailboxes/${email.toLowerCase()}.json`
			const mailboxObj = await c.env.BUCKET.get(mailboxKey)
			if (!mailboxObj) continue

			const settings = (await mailboxObj.json()) as Record<string, unknown>

			// Only include creators that have opted in to being public
			if (settings.isPublicBoard !== true) continue

			creators.push({
				id: email,
				name: (settings.fromName as string) || email.split("@")[0] || email,
				bio: (settings.bio as string) || null,
				avatarUrl: settings.avatarUpdatedAt
					? `/api/v1/creator/${encodeURIComponent(email)}/avatar`
					: null,
				coverUrl: settings.coverUpdatedAt
					? `/api/v1/creator/${encodeURIComponent(email)}/cover`
					: null,
				avatarVersion: (settings.avatarUpdatedAt as string) || null,
				coverVersion: (settings.coverUpdatedAt as string) || null,
				subscriberCount: 0,
				postCount: 0,
				itemCount: 0,
				website: (settings.website as string) || null,
				location: (settings.location as string) || null,
			})
		}

		return c.json(creators)
	} catch (err) {
		console.error("Error fetching top creators:", err)
		return c.json({ error: "Failed to fetch creators" }, 500)
	}
})

// GET /api/v1/creator/:creatorId — public creator profile
app.get("/api/v1/creator/:creatorId", async (c) => {
	try {
		const creatorId = decodeURIComponent(c.req.param("creatorId")!)
		const mailboxKey = `mailboxes/${creatorId.toLowerCase()}.json`
		const obj = await c.env.BUCKET.get(mailboxKey)
		if (!obj) return c.json({ error: "Creator not found" }, 404)

		const settings = (await obj.json()) as Record<string, unknown>

		return c.json({
			id: creatorId,
			name: (settings.fromName as string) || creatorId.split("@")[0] || creatorId,
			bio: (settings.bio as string) || null,
			avatarUrl: settings.avatarUpdatedAt
				? `/api/v1/creator/${encodeURIComponent(creatorId)}/avatar`
				: null,
			coverUrl: settings.coverUpdatedAt
				? `/api/v1/creator/${encodeURIComponent(creatorId)}/cover`
				: null,
			avatarVersion: (settings.avatarUpdatedAt as string) || null,
			coverVersion: (settings.coverUpdatedAt as string) || null,
			subscriberCount: 0,
			postCount: 0,
			itemCount: 0,
			website: (settings.website as string) || null,
			location: (settings.location as string) || null,
		})
	} catch (err) {
		console.error("Error fetching creator profile:", err)
		return c.json({ error: "Failed to fetch creator" }, 500)
	}
})

// GET /api/v1/creator/:creatorId/content — public content with gate metadata
app.get("/api/v1/creator/:creatorId/content", async (c) => {
	try {
		const creatorId = decodeURIComponent(c.req.param("creatorId")!)
		const page = parseInt(c.req.query("page") || "1", 10) || 1
		const limit = parseInt(c.req.query("limit") || "20", 10) || 20

		return c.json({
			items: [],
			totalCount: 0,
			page,
			limit,
		})
	} catch (err) {
		console.error("Error fetching creator content:", err)
		return c.json({ error: "Failed to fetch content" }, 500)
	}
})

// Serve avatar for creator (public, no auth needed)
app.get("/api/v1/creator/:creatorId/avatar", async (c) => {
	try {
		const creatorId = decodeURIComponent(c.req.param("creatorId")!)
		const avatarKey = `profile/avatars/${creatorId.toLowerCase()}`
		const obj = await c.env.BUCKET.get(avatarKey)
		if (!obj) return c.body(null, 404)

		const headers = new Headers()
		headers.set("Content-Type", obj.httpMetadata?.contentType || "image/jpeg")
		headers.set("Cache-Control", "public, max-age=300")
		if (obj.etag) headers.set("ETag", obj.etag)
		return new Response(obj.body, { headers })
	} catch {
		return c.body(null, 404)
	}
})

// Serve cover for creator (public, no auth needed)
app.get("/api/v1/creator/:creatorId/cover", async (c) => {
	try {
		const creatorId = decodeURIComponent(c.req.param("creatorId")!)
		const coverKey = `profile/covers/${creatorId.toLowerCase()}`
		const obj = await c.env.BUCKET.get(coverKey)
		if (!obj) return c.body(null, 404)

		const headers = new Headers()
		headers.set("Content-Type", obj.httpMetadata?.contentType || "image/jpeg")
		headers.set("Cache-Control", "public, max-age=300")
		if (obj.etag) headers.set("ETag", obj.etag)
		return new Response(obj.body, { headers })
	} catch {
		return c.body(null, 404)
	}
})

export { app }
