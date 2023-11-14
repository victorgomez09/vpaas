const defaultTheme = require('tailwindcss/defaultTheme');

module.exports = {
	content: ['./**/*.html', './src/**/*.{js,jsx,ts,tsx,svelte}', "./node_modules/flowbite-svelte/**/*.{html,js,svelte,ts}",],
	important: true,
	daisyui: {
		themes: [
		  "light",
		  "dark",
		  "cupcake",
		  "bumblebee",
		  "emerald",
		  "corporate",
		  "synthwave",
		  "retro",
		  "cyberpunk",
		  "valentine",
		  "halloween",
		  "garden",
		  "forest",
		  "aqua",
		  "lofi",
		  "pastel",
		  "fantasy",
		  "wireframe",
		  "black",
		  "luxury",
		  "dracula",
		  "cmyk",
		  "autumn",
		  "business",
		  "acid",
		  "lemonade",
		  "night",
		  "coffee",
		  "winter",
		  "dim",
		  "nord",
		  "sunset",
		],
	  },
	theme: {
		extend: {
			keyframes: {
				wiggle: {
					'0%, 100%': { transform: 'rotate(-3deg)' },
					'50%': { transform: 'rotate(3deg)' }
				}
			},
			animation: {
				wiggle: 'wiggle 0.5s ease-in-out infinite'
			},
			fontFamily: {
				sans: ['Poppins', ...defaultTheme.fontFamily.sans]
			},
			colors: {
				"applications": "#16A34A",
				"databases": "#9333EA",
				"databases-100": "#9b46ea",
				"destinations": "#0284C7",
				"sources": "#EA580C",
				"services": "#DB2777",
				"settings": "#FEE440",
				"iam": "#C026D3",
				coollabs: '#6B16ED',
				'coollabs-100': '#7317FF',
				coolblack: '#141414',
				'coolgray-100': '#181818',
				'coolgray-200': '#202020',
				'coolgray-300': '#242424',
				'coolgray-400': '#282828',
				'coolgray-500': '#323232'
			}
		}
	},
	variants: {
		scrollbar: ['dark'],
		extend: {}
	},
	darkMode: 'class',
	plugins: [require('daisyui'), require("@tailwindcss/typography")]
};
