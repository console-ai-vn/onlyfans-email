import { Button, useKumoToastManager } from "@cloudflare/kumo";
import { XIcon, UploadIcon } from "@phosphor-icons/react";
import { useRef, useState, useCallback } from "react";

interface UploadProgressProps {
	uploadUrl: string;
	onComplete: (result: { uid?: string; id?: string; key?: string }) => void;
	onError: (error: string) => void;
	file?: File | null;
}

export default function UploadProgress({
	uploadUrl,
	onComplete,
	onError,
	file,
}: UploadProgressProps) {
	const [progress, setProgress] = useState(0);
	const [status, setStatus] = useState<"uploading" | "cancelled" | "done">(
		"uploading",
	);
	const controllerRef = useRef<AbortController | null>(null);
	const toastManager = useKumoToastManager();

	const handleCancel = useCallback(() => {
		controllerRef.current?.abort();
		setStatus("cancelled");
		toastManager.add({ title: "Upload cancelled" });
	}, [toastManager]);

	const doUpload = useCallback(async () => {
		if (!uploadUrl) {
			onError("No upload URL provided");
			return;
		}

		const controller = new AbortController();
		controllerRef.current = controller;

		try {
			// For Cloudflare direct upload, we need to send the file
			// to the upload URL as a POST with multipart/form-data
			const formData = new FormData();

			if (file) {
				formData.append("file", file);
			}

			// Use XMLHttpRequest for progress tracking
			const xhr = new XMLHttpRequest();

			const result = await new Promise<Record<string, unknown>>(
				(resolve, reject) => {
					xhr.upload.addEventListener("progress", (e) => {
						if (e.lengthComputable) {
							const pct = Math.round((e.loaded / e.total) * 100);
							setProgress(pct);
						}
					});

					xhr.addEventListener("load", () => {
						if (xhr.status >= 200 && xhr.status < 300) {
							try {
								const response = JSON.parse(xhr.responseText);
								resolve(response.result || response);
							} catch {
								resolve({});
							}
						} else {
							try {
								const err = JSON.parse(xhr.responseText);
								reject(
									new Error(
										(err.errors?.[0]?.message as string) ||
											`Upload failed: ${xhr.status}`,
									),
								);
							} catch {
								reject(new Error(`Upload failed: ${xhr.status}`));
							}
						}
					});

					xhr.addEventListener("error", () => {
						reject(new Error("Network error during upload"));
					});

					xhr.addEventListener("abort", () => {
						reject(new DOMException("Upload cancelled", "AbortError"));
					});

					controller.signal.addEventListener("abort", () => {
						xhr.abort();
					});

					xhr.open("POST", uploadUrl);

					if (file) {
						xhr.send(formData);
					} else {
						xhr.setRequestHeader(
							"Content-Type",
							"application/json",
						);
						xhr.send(JSON.stringify({}));
					}
				},
			);

			setStatus("done");
			setProgress(100);
			onComplete(result as { uid?: string; id?: string; key?: string });
		} catch (error) {
			if (
				error instanceof DOMException &&
				error.name === "AbortError"
			) {
				return;
			}
			const message =
				error instanceof Error ? error.message : "Upload failed";
			onError(message);
		}
	}, [uploadUrl, file, onComplete, onError]);

	// Auto-start upload
	const startedRef = useRef(false);
	if (!startedRef.current) {
		startedRef.current = true;
		void doUpload();
	}

	const filename = file?.name || "file";
	const fileSize = file
		? file.size > 1024 * 1024
			? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
			: `${Math.round(file.size / 1024)} KB`
		: "";

	return (
		<div className="w-full rounded-xl border border-kumo-line bg-kumo-base p-4 shadow-sm">
			<div className="flex items-start justify-between gap-3">
				<div className="min-w-0 flex-1">
					<div className="flex items-center gap-2">
						<UploadIcon
							size={18}
							className="shrink-0 text-kumo-subtle"
						/>
						<span className="truncate text-sm font-medium text-kumo-default">
							{filename}
						</span>
					</div>
					{fileSize && (
						<p className="mt-0.5 text-xs text-kumo-subtle">{fileSize}</p>
					)}
				</div>
				{status === "uploading" && (
					<Button
						variant="ghost"
						size="sm"
						icon={<XIcon size={14} />}
						onClick={handleCancel}
						aria-label="Cancel upload"
					/>
				)}
			</div>

			<div className="mt-3">
				{status === "uploading" && (
					<div className="relative h-2 w-full overflow-hidden rounded-full bg-kumo-recessed">
						<div
							className="h-full rounded-full bg-kumo-brand transition-all duration-300"
							style={{ width: `${Math.max(5, progress)}%` }}
						/>
					</div>
				)}
				<div className="mt-1 flex items-center justify-between">
					<span className="text-xs text-kumo-subtle">
						{status === "uploading" &&
							`Uploading... ${progress}%`}
						{status === "done" && "Upload complete"}
						{status === "cancelled" && "Upload cancelled"}
					</span>
				</div>
			</div>
		</div>
	);
}
