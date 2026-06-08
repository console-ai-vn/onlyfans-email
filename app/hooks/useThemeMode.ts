// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

import { useEffect, useState } from "react";

type ThemeMode = "light" | "dark";

const STORAGE_KEY = "vsbg-theme-mode";

function preferredMode(): ThemeMode {
	if (typeof window === "undefined") return "light";
	const stored = window.localStorage.getItem(STORAGE_KEY);
	if (stored === "dark" || stored === "light") return stored;
	return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyMode(mode: ThemeMode) {
	if (typeof document === "undefined") return;
	document.documentElement.dataset.mode = mode;
}

export function useThemeMode() {
	const [mode, setMode] = useState<ThemeMode>("light");

	useEffect(() => {
		const next = preferredMode();
		setMode(next);
		applyMode(next);
	}, []);

	const toggleMode = () => {
		setMode((current) => {
			const next = current === "dark" ? "light" : "dark";
			window.localStorage.setItem(STORAGE_KEY, next);
			applyMode(next);
			return next;
		});
	};

	return { mode, toggleMode };
}
