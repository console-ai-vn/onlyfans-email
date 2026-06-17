import { type FormEvent, useMemo, useState } from "react";

export function meta() {
	return [
		{ title: "ONYX - Internal Social Mail" },
		{
			name: "description",
			content: "Internal mailboxes @onyx.com.vn ? login b?ng mailbox n?i b?, kh?ng d?ng email c? nh?n.",
		},
	];
}

type SignupState = "idle" | "submitting" | "success" | "error";

function normalizeHandle(value: string) {
	return value
		.toLowerCase()
		.replace(/[^a-z0-9._-]/g, "")
		.replace(/^[._-]+/, "");
}

export default function LandingRoute() {
	const [displayName, setDisplayName] = useState("");
	const [personalEmail, setPersonalEmail] = useState("");
	const [handle, setHandle] = useState("");
	const [note, setNote] = useState("");
	const [status, setStatus] = useState<SignupState>("idle");
	const [error, setError] = useState("");
	const mailbox = useMemo(() => `${normalizeHandle(handle || "nomad") || "nomad"}@onyx.com.vn`, [handle]);
	const loginUrl = "https://box.onyx.com.vn/app";

	async function submitSignup(e: FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setStatus("submitting");
		setError("");
		try {
			const res = await fetch("/api/public/signup-requests", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ displayName, personalEmail, desiredMailbox: mailbox, note }),
			});
			if (!res.ok) {
				const body = await res.json().catch(() => ({})) as { error?: string };
				throw new Error(body.error || "Kh?ng g?i du?c y?u c?u dang k?");
			}
			setStatus("success");
			setDisplayName("");
			setPersonalEmail("");
			setHandle("");
			setNote("");
		} catch (err) {
			setStatus("error");
			setError(err instanceof Error ? err.message : "Kh?ng g?i du?c y?u c?u dang k?");
		}
	}

	return (
		<main className="min-h-screen overflow-hidden bg-[#0a1020] text-white">
			<div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(64,120,255,0.28),transparent_34%),radial-gradient(circle_at_80%_10%,rgba(30,214,160,0.18),transparent_30%),linear-gradient(135deg,#0a1020_0%,#111827_48%,#07111f_100%)]" />
			<div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-6 md:px-10">
				<header className="flex items-center justify-between">
					<a href="/" className="flex items-center gap-3 no-underline">
						<div className="grid h-10 w-10 place-items-center rounded-2xl bg-white text-sm font-black text-[#0a1020] shadow-xl shadow-blue-950/30">
							VB
						</div>
						<div>
							<div className="text-sm font-semibold tracking-[0.24em] text-white/60">ONYX BOX</div>
							<div className="text-xs text-white/45">Private team feed</div>
						</div>
					</a>
					<nav className="flex items-center gap-3">
						<a
							href="#signup"
							className="hidden rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-white/75 no-underline transition hover:border-white/35 hover:text-white sm:inline-flex"
						>
							?ang k?
						</a>
						<a
							href={loginUrl}
							className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-[#0a1020] no-underline shadow-lg shadow-blue-950/20 transition hover:-translate-y-0.5"
						>
							?ang nh?p
						</a>
					</nav>
				</header>

				<section className="grid flex-1 items-center gap-12 py-14 lg:grid-cols-[1.05fr_0.95fr] lg:py-10">
					<div className="max-w-3xl">
						<div className="mb-6 inline-flex rounded-full border border-white/12 bg-white/7 px-4 py-2 text-sm text-white/70 backdrop-blur">
							Login b?ng mailbox @onyx.com.vn. Email c? nh?n ch? nh?n th?ng b?o l?n d?u.
						</div>
						<h1 className="text-5xl font-semibold leading-[0.98] tracking-[-0.06em] text-white md:text-7xl">
							M?t m?ng x? h?i nh? n?m trong email n?i b?.
						</h1>
						<p className="mt-6 max-w-2xl text-lg leading-8 text-white/65 md:text-xl">
							M?i ngu?i c? mailbox <strong className="text-white">nomad@onyx.com.vn</strong> v?
							<strong className="text-white"> dang nh?p b?ng ch?nh d?a ch? d?</strong>. Email c? nh?n ch? d? nh?n th?ng b?o k?ch ho?t l?n d?u; sau d? OTP v?o mailbox n?i b?.
						</p>
						<div className="mt-8 flex flex-col gap-3 sm:flex-row">
							<a
								href={loginUrl}
								className="inline-flex items-center justify-center rounded-full bg-[#4f7cff] px-6 py-3 text-sm font-bold text-white no-underline shadow-2xl shadow-blue-900/40 transition hover:-translate-y-0.5 hover:bg-[#6a90ff]"
							>
								?ang nh?p b?ng OTP
							</a>
							<a
								href="#signup"
								className="inline-flex items-center justify-center rounded-full border border-white/15 px-6 py-3 text-sm font-semibold text-white no-underline transition hover:border-white/35 hover:bg-white/8"
							>
								?ang k? user m?i
							</a>
						</div>
						<div className="mt-10 grid max-w-2xl gap-3 sm:grid-cols-3">
							{[
								["Internal only", "Ch?n g?i ra ngo?i"],
								["Image ready", "?nh v? file preview"],
								["Access OTP", "Login b?ng @onyx.com.vn"],
							].map(([title, text]) => (
								<div key={title} className="rounded-3xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur">
									<div className="text-sm font-semibold text-white">{title}</div>
									<div className="mt-1 text-xs leading-5 text-white/50">{text}</div>
								</div>
							))}
						</div>
					</div>

					<div className="rounded-[2rem] border border-white/12 bg-white/[0.08] p-4 shadow-2xl shadow-black/30 backdrop-blur-xl">
						<div className="rounded-[1.5rem] bg-[#f6f8fb] p-4 text-[#101828]">
							<div className="flex items-center justify-between border-b border-slate-200 pb-4">
								<div>
									<div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Team Feed</div>
									<div className="mt-1 text-lg font-bold">admin@onyx.com.vn</div>
								</div>
								<div className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">Internal</div>
							</div>
							<div className="space-y-3 py-4">
								{[
									["N", "nomad", "G?i proposal ?nh qua feed", "2 ?nh"],
									["M", "marketing", "Update campaign n?i b?", "3 replies"],
									["S", "sale", "Lead m?i c?n admin duy?t", "urgent"],
								].map(([avatar, name, title, tag]) => (
									<div key={name} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
										<div className="flex gap-3">
											<div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-slate-900 text-sm font-bold text-white">{avatar}</div>
											<div className="min-w-0 flex-1">
												<div className="flex items-center justify-between gap-3">
													<div className="font-semibold">{name}@onyx.com.vn</div>
													<div className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-500">{tag}</div>
												</div>
												<div className="mt-1 text-sm text-slate-500">{title}</div>
											</div>
										</div>
									</div>
								))}
							</div>
							<div className="rounded-2xl bg-slate-900 p-4 text-white">
								<div className="text-sm font-semibold">Outbound guard</div>
								<div className="mt-1 text-xs leading-5 text-white/60">
									External email sending is disabled. Send only to internal mailboxes.
								</div>
							</div>
						</div>
					</div>
				</section>

				<section id="signup" className="pb-12">
					<div className="grid gap-6 rounded-[2rem] border border-white/12 bg-white/[0.07] p-5 backdrop-blur-xl lg:grid-cols-[0.85fr_1.15fr] lg:p-8">
						<div className="p-2">
							<h2 className="text-3xl font-semibold tracking-[-0.04em]">?ang k? user n?i b?</h2>
							<p className="mt-4 text-sm leading-7 text-white/60">
								Form n?y t?o y?u c?u c?p user. Admin duy?t s? c?p mailbox @onyx.com.vn v? quy?n login Access ? email c? nh?n ch? nh?n th?ng b?o k?ch ho?t m?t l?n.
							</p>
							<div className="mt-6 rounded-3xl bg-black/20 p-4 text-sm text-white/65">
								<div className="font-semibold text-white">Flow chu?n:</div>
								<ol className="mt-3 list-decimal space-y-2 pl-5">
									<li>Ch?n mailbox: nomad@onyx.com.vn.</li>
									<li>Khai b?o email c? nh?n nh?n th?ng b?o k?ch ho?t.</li>
									<li>Admin duy?t ? user login b?ng mailbox @onyx.com.vn t?i box.onyx.com.vn.</li>
								</ol>
							</div>
						</div>
						<form onSubmit={submitSignup} className="rounded-[1.5rem] bg-white p-5 text-[#101828] shadow-xl">
							<div className="grid gap-4 md:grid-cols-2">
								<label className="block">
									<span className="text-sm font-semibold text-slate-700">T?n user</span>
									<input required value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Nguy?n Th?i Hi?u" className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#4f7cff] focus:ring-4 focus:ring-blue-100" />
								</label>
								<label className="block">
									<span className="text-sm font-semibold text-slate-700">Email c? nh?n nh?n th?ng b?o</span>
									<input required type="email" value={personalEmail} onChange={(e) => setPersonalEmail(e.target.value)} placeholder="you@gmail.com" className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#4f7cff] focus:ring-4 focus:ring-blue-100" />
								</label>
							</div>
							<label className="mt-4 block">
								<span className="text-sm font-semibold text-slate-700">Mailbox mu?n c?p</span>
								<div className="mt-2 flex overflow-hidden rounded-2xl border border-slate-200 focus-within:border-[#4f7cff] focus-within:ring-4 focus-within:ring-blue-100">
									<input required value={handle} onChange={(e) => setHandle(normalizeHandle(e.target.value))} placeholder="nomad" className="min-w-0 flex-1 px-4 py-3 text-sm outline-none" />
									<div className="border-l border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-500">@onyx.com.vn</div>
								</div>
								<div className="mt-2 text-xs text-slate-500">Preview: {mailbox}</div>
							</label>
							<label className="mt-4 block">
								<span className="text-sm font-semibold text-slate-700">Ghi ch?</span>
								<textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Role, team, l? do c?p quy?n..." rows={3} className="mt-2 w-full resize-none rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#4f7cff] focus:ring-4 focus:ring-blue-100" />
							</label>
							{status === "success" && (
								<div className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">?? ghi nh?n. Admin duy?t xong b?n s? nh?n email ? login box b?ng mailbox @onyx.com.vn.</div>
							)}
							{status === "error" && (
								<div className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>
							)}
							<button type="submit" disabled={status === "submitting"} className="mt-5 w-full rounded-2xl bg-[#101828] px-5 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#1f2937] disabled:cursor-not-allowed disabled:opacity-60">
								{status === "submitting" ? "?ang g?i..." : "G?i y?u c?u dang k?"}
							</button>
						</form>
					</div>
				</section>
			</div>
		</main>
	);
}
