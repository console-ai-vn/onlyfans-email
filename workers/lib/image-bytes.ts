const JPEG_MAGIC = [0xff, 0xd8, 0xff];
const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47];
const WEBP_RIFF = [0x52, 0x49, 0x46, 0x46];
const WEBP_TAG = [0x57, 0x45, 0x42, 0x50];

export function assertImageMagicBytes(bytes: Uint8Array, contentType: string) {
	const type = contentType.trim().toLowerCase();
	if (type === "image/jpeg" && !startsWith(bytes, JPEG_MAGIC)) {
		throw new Error("Image payload does not match JPEG format");
	}
	if (type === "image/png" && !startsWith(bytes, PNG_MAGIC)) {
		throw new Error("Image payload does not match PNG format");
	}
	if (
		type === "image/webp" &&
		(!startsWith(bytes, WEBP_RIFF) || !hasBytes(bytes, WEBP_TAG, 8))
	) {
		throw new Error("Image payload does not match WebP format");
	}
}

function startsWith(bytes: Uint8Array, prefix: number[]) {
	if (bytes.length < prefix.length) return false;
	return prefix.every((value, index) => bytes[index] === value);
}

function hasBytes(bytes: Uint8Array, pattern: number[], offset: number) {
	if (bytes.length < offset + pattern.length) return false;
	return pattern.every((value, index) => bytes[offset + index] === value);
}