// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

export interface Env extends Cloudflare.Env {
	POLICY_AUD?: string;
	TEAM_DOMAIN?: string;
	ACCESS_EMAIL_ADDRESSES: Cloudflare.Env["ACCESS_EMAIL_ADDRESSES"];
	DEMO_MODE?: string;
}

export interface AccessVariables {
	accessEmail: string;
}
