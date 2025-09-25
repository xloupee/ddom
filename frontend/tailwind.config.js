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
                // Dynamic colors using CSS variables
                text: {
                    dark: 'var(--text-dark)',
                    medium: 'var(--text-medium)',
                    light: 'var(--text-light)',
                    subtle: 'var(--text-subtle)',
                },
                surface: {
                    primary: 'var(--surface-primary)',
                    secondary: 'var(--surface-secondary)',
                    background: 'var(--background-primary)',
                    'background-secondary': 'var(--background-secondary)',
                },
                border: {
                    primary: 'var(--border-color)',
                    secondary: 'var(--beige-medium)',
                },
                accent: {
                    primary: 'var(--accent-primary)',
                    hover: 'var(--accent-hover)',
                },
                // Static Anthropic colors for gradients/fixed colors
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
                // Brand colors using CSS variables
                brand: {
                    50: 'var(--beige-whisper)',
                    100: 'var(--beige-ultra-light)',
                    200: 'var(--surface-secondary)',
                    300: '#e1bfa5',
                    400: '#d8ac8c',
                    500: 'var(--accent-primary)',
                    600: 'var(--accent-hover)',
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
