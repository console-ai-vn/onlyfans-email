// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

import type { ConversationState } from "~/types";

interface ConversationStateControlsProps {
	state?: ConversationState;
	disabled?: boolean;
	onChange: (patch: Partial<ConversationState>) => void;
}

const selectClassName =
	"h-9 rounded-md border border-kumo-line bg-kumo-base px-2 text-sm text-kumo-default outline-none focus:border-kumo-brand";

export default function ConversationStateControls({
	state,
	disabled,
	onChange,
}: ConversationStateControlsProps) {
	return (
		<div className="grid grid-cols-2 gap-2">
			<label className="space-y-1">
				<span className="text-xs font-medium text-kumo-subtle">Status</span>
				<select
					className={selectClassName}
					value={state?.status ?? "open"}
					disabled={disabled}
					onChange={(event) =>
						onChange({ status: event.target.value as ConversationState["status"] })
					}
				>
					<option value="open">Open</option>
					<option value="waiting">Waiting</option>
					<option value="done">Done</option>
				</select>
			</label>
			<label className="space-y-1">
				<span className="text-xs font-medium text-kumo-subtle">Priority</span>
				<select
					className={selectClassName}
					value={state?.priority ?? "normal"}
					disabled={disabled}
					onChange={(event) =>
						onChange({ priority: event.target.value as ConversationState["priority"] })
					}
				>
					<option value="low">Low</option>
					<option value="normal">Normal</option>
					<option value="high">High</option>
				</select>
			</label>
			<label className="col-span-2 space-y-1">
				<span className="text-xs font-medium text-kumo-subtle">Assignee</span>
				<input
					key={state?.assignee_email ?? "unassigned"}
					className={`${selectClassName} w-full`}
					defaultValue={state?.assignee_email ?? ""}
					disabled={disabled}
					placeholder="name@example.com"
					onBlur={(event) => onChange({ assignee_email: event.target.value.trim() })}
				/>
			</label>
			<label className="col-span-2 flex items-center gap-2 rounded-md border border-kumo-line px-3 py-2 text-sm text-kumo-default">
				<input
					type="checkbox"
					checked={state?.needs_reply ?? false}
					disabled={disabled}
					onChange={(event) => onChange({ needs_reply: event.target.checked })}
				/>
				Needs reply
			</label>
		</div>
	);
}
