export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
export const MAX_MESSAGE_IMAGE_SIZE = 25 * 1024 * 1024;

export interface OutgoingImageAttachment {
	content: string;
	filename: string;
	type: string;
	disposition: "attachment";
	size: number;
}

function readFileAsBase64(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onerror = () => reject(new Error(`Could not read ${file.name}`));
		reader.onload = () => {
			const result = String(reader.result || "");
			resolve(result.slice(result.indexOf(",") + 1));
		};
		reader.readAsDataURL(file);
	});
}

export async function filesToImageAttachments(
	files: File[],
	existing: OutgoingImageAttachment[] = [],
) {
	let totalSize = existing.reduce((sum, attachment) => sum + attachment.size, 0);
	const next: OutgoingImageAttachment[] = [];

	for (const file of files) {
		if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
			throw new Error("Only JPEG, PNG, and WebP images are allowed.");
		}
		if (file.size > MAX_IMAGE_SIZE) {
			throw new Error(`${file.name} is larger than 10MB.`);
		}
		totalSize += file.size;
		if (totalSize > MAX_MESSAGE_IMAGE_SIZE) {
			throw new Error("Total image attachments must be 25MB or smaller.");
		}
		next.push({
			content: await readFileAsBase64(file),
			filename: file.name || "image",
			type: file.type,
			disposition: "attachment",
			size: file.size,
		});
	}

	return next;
}
