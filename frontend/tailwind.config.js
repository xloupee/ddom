/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
        './src/popup/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                // Anthropic Color Palette
                anthropic: {
                    orange: '#d4a37f',
                    'orange-light': '#d8ac8c',
                    'orange-medium': '#ddb599',
                    'orange-warm': '#e1bfa5',
                    'beige-light': '#e5c8b2',
                    'beige-medium': '#ead1bf',
                    'beige-soft': '#eedacc',
                    'beige-pale': '#f2e3d9',
                    'beige-ultra-light': '#f6ede5',
                    'beige-whisper': '#fbf6f2',
                },
                text: {
                    dark: '#2c1810',
                    medium: '#5d4037',
                    light: '#8d6e63',
                    subtle: '#a1887f',
                },
                surface: {
                    primary: '#ffffff',
                    secondary: '#eedacc',
                    background: '#fbf6f2',
                    'background-secondary': '#f6ede5',
                },
                border: {
                    primary: '#e5c8b2',
                    secondary: '#ead1bf',
                },
                // Keep some grays for compatibility
                gray: {
                    50: '#fbf6f2',
                    100: '#f6ede5',
                    200: '#eedacc',
                    300: '#e5c8b2',
                    400: '#a1887f',
                    500: '#8d6e63',
                    600: '#5d4037',
                    700: '#2c1810',
                    800: '#1f1310',
                    900: '#161008',
                    950: '#0d0804',
                },
                // Update brand colors to use Anthropic orange
                brand: {
                    50: '#fbf6f2',
                    100: '#f6ede5',
                    200: '#eedacc',
                    300: '#e1bfa5',
                    400: '#d8ac8c',
                    500: '#d4a37f',
                    600: '#c89968',
                    700: '#b58a56',
                    800: '#9a7449',
                    900: '#7d5e3b',
                }
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
            boxShadow: {
                'anthropic': '0 1px 3px rgba(212, 163, 127, 0.1), 0 1px 2px rgba(212, 163, 127, 0.06)',
                'anthropic-lg': '0 4px 6px rgba(212, 163, 127, 0.15), 0 2px 4px rgba(212, 163, 127, 0.08)',
                'anthropic-xl': '0 10px 15px rgba(212, 163, 127, 0.2), 0 4px 6px rgba(212, 163, 127, 0.1)',
            },
        },
    },
    plugins: [
        require('@tailwindcss/typography'),
    ],
}
