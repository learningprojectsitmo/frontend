/** @type {import('tailwindcss').Config} */
import tailwindcssAnimate from "tailwindcss-animate";
import typography from "@tailwindcss/typography";

export default {
    darkMode: ["class"],
    content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
    safelist: ["text-signature-small"],
    theme: {
        container: {
            center: true,
            padding: "2rem",
            screens: {
                "2xl": "1400px",
            },
        },
        extend: {
            fontFamily: {
                sans: [
                    "Inter",
                    "system-ui",
                    "-apple-system",
                    "Segoe UI",
                    "Roboto",
                    "Helvetica Neue",
                    "Arial",
                    "sans-serif",
                ],
            },
            // Кастомные размеры текста с именами из дизайна
            fontSize: {
                "heading-1": ["48px", { lineHeight: "1.2", letterSpacing: "-0.02em" }],
                "heading-2": ["36px"],
                "heading-3": ["30px", { lineHeight: "1.3", letterSpacing: "-0.01em" }],
                "heading-4": ["24px", { lineHeight: "1.3", letterSpacing: "-0.01em" }],
                subheading: ["20px", { lineHeight: "1.4", letterSpacing: "0" }],
                "body-large": ["18px", { lineHeight: "1.5", letterSpacing: "0" }],
                body: ["16px", { lineHeight: "1.5", letterSpacing: "0" }],
                "button-large": ["18px", { lineHeight: "1.5", letterSpacing: "0.02em" }],
                button: ["16px", { lineHeight: "1.5", letterSpacing: "0.02em" }],
                input: ["16px", { lineHeight: "1.5", letterSpacing: "0" }],
                "input-message": ["14px", { lineHeight: "1.4", letterSpacing: "0" }],
                signature: ["14px", { lineHeight: "1.4", letterSpacing: "0" }],
                "signature-small": ["12px", { lineHeight: "1.4", letterSpacing: "0" }],
                link: ["16px", { lineHeight: "1.5", letterSpacing: "0" }],
            },
            colors: {
                // Design system tokens (dark-aware via CSS vars)
                app: {
                    background: "var(--app-background)",
                    surface: "var(--app-surface)",
                    border: "var(--app-border)",
                    "border-light": "var(--app-border-light)",
                    text: "var(--app-text)",
                    muted: "var(--app-muted)",
                    primary: "var(--app-primary)",
                    blue: "var(--app-blue)",
                    ghost: "var(--app-ghost)",
                    "badge-blue": "var(--app-badge-blue-bg)",
                    "badge-blue-fg": "var(--app-badge-blue-fg)",
                    "badge-amber": "var(--app-badge-amber-bg)",
                    "badge-amber-fg": "var(--app-badge-amber-fg)",
                    "badge-pink": "var(--app-badge-pink-bg)",
                    "badge-pink-fg": "var(--app-badge-pink-fg)",
                },
                // Neutral gray scale (dark-aware via CSS vars, light = Tailwind defaults)
                gray: {
                    50: "var(--gray-50)",
                    100: "var(--gray-100)",
                    200: "var(--gray-200)",
                    300: "var(--gray-300)",
                    400: "var(--gray-400)",
                    500: "var(--gray-500)",
                    600: "var(--gray-600)",
                    700: "var(--gray-700)",
                    800: "var(--gray-800)",
                    900: "var(--gray-900)",
                    950: "var(--gray-950)",
                },
                border: "hsl(var(--border))",
                input: "hsl(var(--input))",
                ring: "hsl(var(--ring))",
                background: "hsl(var(--background))",
                foreground: "hsl(var(--foreground))",
                primary: {
                    DEFAULT: "hsl(var(--primary))",
                    foreground: "hsl(var(--primary-foreground))",
                },
                secondary: {
                    DEFAULT: "hsl(var(--secondary))",
                    foreground: "hsl(var(--secondary-foreground))",
                },
                destructive: {
                    DEFAULT: "hsl(var(--destructive))",
                    foreground: "hsl(var(--destructive-foreground))",
                },
                muted: {
                    DEFAULT: "hsl(var(--muted))",
                    foreground: "hsl(var(--muted-foreground))",
                },
                accent: {
                    DEFAULT: "hsl(var(--accent))",
                    foreground: "hsl(var(--accent-foreground))",
                },
                popover: {
                    DEFAULT: "hsl(var(--popover))",
                    foreground: "hsl(var(--popover-foreground))",
                },
                card: {
                    DEFAULT: "hsl(var(--card))",
                    foreground: "hsl(var(--card-foreground))",
                },
                chart: {
                    1: "hsl(var(--chart-1))",
                    2: "hsl(var(--chart-2))",
                    3: "hsl(var(--chart-3))",
                    4: "hsl(var(--chart-4))",
                    5: "hsl(var(--chart-5))",
                },
            },
            borderRadius: {
                lg: "var(--radius)",
                md: "calc(var(--radius) - 2px)",
                sm: "calc(var(--radius) - 4px)",
            },
            keyframes: {
                "accordion-down": {
                    from: {
                        height: "0",
                    },
                    to: {
                        height: "var(--radix-accordion-content-height)",
                    },
                },
                "accordion-up": {
                    from: {
                        height: "var(--radix-accordion-content-height)",
                    },
                    to: {
                        height: "0",
                    },
                },
                "fade-in-up": {
                    from: {
                        opacity: "0",
                        transform: "translateY(20px)",
                    },
                    to: {
                        opacity: "1",
                        transform: "translateY(0)",
                    },
                },
                "fade-in-left": {
                    from: {
                        opacity: "0",
                        transform: "translateX(-20px)",
                    },
                    to: {
                        opacity: "1",
                        transform: "translateX(0)",
                    },
                },
                "fade-in-right": {
                    from: {
                        opacity: "0",
                        transform: "translateX(20px)",
                    },
                    to: {
                        opacity: "1",
                        transform: "translateX(0)",
                    },
                },
                "filter-in": {
                    "0%": {
                        opacity: "0",
                        transform: "translateY(-4px)",
                    },
                    "100%": {
                        opacity: "1",
                        transform: "translateY(0)",
                    },
                },
            },
            animation: {
                "accordion-down": "accordion-down 0.2s ease-out",
                "accordion-up": "accordion-up 0.2s ease-out",
                "fade-in-up": "fade-in-up 0.6s ease-out forwards",
                "fade-in-left": "fade-in-left 0.5s ease-out forwards",
                "fade-in-right": "fade-in-right 0.5s ease-out forwards",
                "filter-in": "filter-in 160ms cubic-bezier(0.16, 1, 0.3, 1)",
            },
        },
    },
    plugins: [tailwindcssAnimate, typography],
};
