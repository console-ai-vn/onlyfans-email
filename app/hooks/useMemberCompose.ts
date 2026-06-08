import { useNavigate, useParams } from "react-router";
import { useUIStore } from "~/hooks/useUIStore";

export function useMemberCompose() {
	const { mailboxId } = useParams<{ mailboxId: string }>();
	const navigate = useNavigate();
	const { startCompose, closeSidebar } = useUIStore();

	return (email: string, onDone?: () => void) => {
		if (!mailboxId) return;
		const prefillTo = email.trim().toLowerCase();
		onDone?.();
		closeSidebar();
		startCompose({ mode: "new", prefillTo });
		navigate(`/mailbox/${mailboxId}/emails/inbox`);
	};
}