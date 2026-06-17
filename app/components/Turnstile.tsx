// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from "react";

declare global {
	interface Window {
		turnstile?: {
			render: (el: string | HTMLElement, opts: Record<string, unknown>) => string;
			reset: (widgetId?: string) => void;
			remove: (widgetId?: string) => void;
		};
		onTurnstileLoad?: () => void;
	}
}

export interface TurnstileHandle {
	reset: () => void;
}

interface TurnstileProps {
	siteKey: string;
	onVerify: (token: string) => void;
	onError?: () => void;
}

const TURNSTILE_SCRIPT = "https://challenge.cloudflare.com/turnstile/v0/api.js";

/**
 * Cloudflare Turnstile widget component.
 * Dynamically loads the Turnstile script and renders the challenge widget.
 * Provides a `reset()` method via ref to allow re-rendering the challenge.
 */
const Turnstile = forwardRef<TurnstileHandle, TurnstileProps>(
	function Turnstile({ siteKey, onVerify, onError }, ref) {
		const containerRef = useRef<HTMLDivElement>(null);
		const widgetIdRef = useRef<string | null>(null);
		const onVerifyRef = useRef(onVerify);
		const onErrorRef = useRef(onError);

		// Keep callbacks fresh without re-triggering effects
		onVerifyRef.current = onVerify;
		onErrorRef.current = onError;

		const loadScript = useCallback(() => {
			if (document.querySelector(`script[src="${TURNSTILE_SCRIPT}"]`)) {
				return;
			}

			const script = document.createElement("script");
			script.src = TURNSTILE_SCRIPT;
			script.async = true;
			script.defer = true;
			script.setAttribute("data-cfasync", "false");
			document.head.appendChild(script);
		}, []);

		const renderWidget = useCallback(() => {
			if (!containerRef.current) return;
			if (!window.turnstile) return;

			// Remove existing widget if any
			if (widgetIdRef.current) {
				window.turnstile.remove(widgetIdRef.current);
				widgetIdRef.current = null;
			}

			try {
				widgetIdRef.current = window.turnstile.render(containerRef.current, {
					sitekey: siteKey,
					callback: (token: string) => {
						onVerifyRef.current(token);
					},
					"error-callback": () => {
						onErrorRef.current?.();
					},
				});
			} catch {
				// Turnstile failed to render — widget area remains empty
				onErrorRef.current?.();
			}
		}, [siteKey]);

		useEffect(() => {
			loadScript();

			// If turnstile is already loaded, render immediately
			if (window.turnstile) {
				renderWidget();
			} else {
				// Wait for the script to load
				const prev = window.onTurnstileLoad;
				window.onTurnstileLoad = () => {
					prev?.();
					renderWidget();
				};
			}

			return () => {
				// Cleanup widget on unmount
				if (widgetIdRef.current && window.turnstile) {
					window.turnstile.remove(widgetIdRef.current);
					widgetIdRef.current = null;
				}
			};
		}, [loadScript, renderWidget]);

		useImperativeHandle(ref, () => ({
			reset: () => {
				if (widgetIdRef.current && window.turnstile) {
					window.turnstile.reset(widgetIdRef.current);
				}
			},
		}));

		return (
			<div className="flex justify-center">
				<div
					ref={containerRef}
					className="cf-turnstile"
					data-sitekey={siteKey}
				/>
			</div>
		);
	},
);

export default Turnstile;
