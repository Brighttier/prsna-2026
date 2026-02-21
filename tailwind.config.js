/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./{App,index}.tsx",
        "./{components,pages,services,hooks}/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['var(--font-family, -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", "Helvetica Neue", sans-serif)'],
            },
            colors: {
                brand: {
                    50: 'var(--brand-50, #f0fdf4)',
                    100: 'var(--brand-100, #dcfce7)',
                    200: 'var(--brand-200, #bbf7d0)',
                    500: 'var(--brand-600)',
                    600: 'var(--brand-600, #16a34a)',
                    700: 'var(--brand-700, #15803d)',
                    900: '#14532d',
                },
                slate: {
                    850: '#1e293b',
                }
            },
            borderRadius: {
                'apple': '10px',
            },
            boxShadow: {
                'apple-sm': '0 1px 3px 0 rgb(0 0 0 / 0.04), 0 1px 2px -1px rgb(0 0 0 / 0.03)',
                'apple': '0 2px 8px -2px rgb(0 0 0 / 0.08), 0 1px 3px -1px rgb(0 0 0 / 0.04)',
                'apple-md': '0 4px 16px -4px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.04)',
                'apple-lg': '0 8px 30px -6px rgb(0 0 0 / 0.12), 0 4px 8px -4px rgb(0 0 0 / 0.04)',
            },
            transitionDuration: {
                '150': '150ms',
            },
        },
    },
    plugins: [],
}
