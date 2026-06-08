import type { SignupRequestRecord } from "./signup-requests";

const LOGIN_URL = "https://box.vsbg.vn/app";

function escapeHtml(value: string) {
	return value
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;");
}

export function buildSignupApprovalEmail(request: SignupRequestRecord) {
	const mailbox = request.desiredMailbox;
	const personal = request.personalEmail;
	const subject = `VSBG Box — Tài khoản ${mailbox} đã được duyệt`;
	const text = [
		`Xin chào ${request.displayName},`,
		"",
		`Mailbox nội bộ của bạn đã sẵn sàng: ${mailbox}`,
		"",
		"Đăng nhập:",
		`1. Mở ${LOGIN_URL}`,
		`2. Nhập đúng mailbox: ${mailbox} (không dùng ${personal} để login)`,
		"3. Nhận mã OTP tại mailbox nội bộ — email cá nhân chỉ dùng để nhận thông báo này",
		"",
		"Trân trọng,",
		"VSBG Box",
	].join("\n");
	const html = `
<p>Xin chào <strong>${escapeHtml(request.displayName)}</strong>,</p>
<p>Mailbox nội bộ của bạn đã sẵn sàng: <strong>${escapeHtml(mailbox)}</strong></p>
<ol>
  <li>Mở <a href="${LOGIN_URL}">${LOGIN_URL}</a></li>
  <li>Đăng nhập bằng <strong>${escapeHtml(mailbox)}</strong> — không dùng ${escapeHtml(personal)}</li>
  <li>Nhập mã OTP gửi về <strong>${escapeHtml(mailbox)}</strong> (trong app hoặc hộp thư nội bộ)</li>
</ol>
<p>Email cá nhân ${escapeHtml(personal)} chỉ nhận thông báo kích hoạt này — không dùng để đăng nhập.</p>
`.trim();
	return { subject, text, html };
}