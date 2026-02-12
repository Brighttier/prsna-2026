/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['var(--font-family, "Inter", sans-serif)'],
            },
            colors: {
                brand: {
                    50: '#f0fdf4',
                    100: '#dcfce7',
                    500: 'var(--brand-600)', // Map 500 to our dynamic color too
                    600: 'var(--brand-600, #16a34a)',
                    700: '#15803d',
                    900: '#14532d',
                },
                slate: {
                    850: '#1e293b',
                }
            }
        },
    },
    plugins: [],
}
