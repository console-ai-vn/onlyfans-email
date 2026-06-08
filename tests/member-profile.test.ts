import assert from "node:assert/strict";
import test from "node:test";
import { toPublicMemberProfile } from "../workers/lib/member-profile.ts";

test("toPublicMemberProfile uses fromName and optional fields", () => {
	const profile = toPublicMemberProfile(
		"hieu@vsbg.vn",
		{
			fromName: " Thái Hiếu ",
			bio: "  CFP × AI  ",
			location: " HCMC ",
			website: " vsbg.vn ",
			avatarUpdatedAt: "2026-06-08T10:00:00.000Z",
			coverUpdatedAt: "2026-06-08T11:00:00.000Z",
		},
		{ hasAvatar: true, hasCover: false },
	);

	assert.equal(profile.email, "hieu@vsbg.vn");
	assert.equal(profile.displayName, "Thái Hiếu");
	assert.equal(profile.bio, "CFP × AI");
	assert.equal(profile.location, "HCMC");
	assert.equal(profile.website, "vsbg.vn");
	assert.equal(profile.avatarUpdatedAt, "2026-06-08T10:00:00.000Z");
	assert.equal(profile.coverUpdatedAt, "2026-06-08T11:00:00.000Z");
	assert.equal(profile.hasAvatar, true);
	assert.equal(profile.hasCover, false);
});

test("toPublicMemberProfile falls back to local part and nulls empty strings", () => {
	const profile = toPublicMemberProfile("user@vsbg.vn", { bio: "   " }, {
		hasAvatar: false,
		hasCover: false,
	});

	assert.equal(profile.displayName, "user");
	assert.equal(profile.bio, null);
	assert.equal(profile.location, null);
	assert.equal(profile.website, null);
});