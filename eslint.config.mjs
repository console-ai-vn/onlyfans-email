import tseslint from "typescript-eslint";

export default tseslint.config(
	{
		ignores: [
			"build/**",
			".react-router/**",
			".tmp/**",
			"node_modules/**",
			"worker-configuration.d.ts",
		],
	},
	...tseslint.configs.recommended,
	{
		rules: {
			"@typescript-eslint/no-explicit-any": "off",
			"@typescript-eslint/no-unused-vars": [
				"warn",
				{ argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
			],
		},
	},
);