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
            },
            animation: {
                "accordion-down": "accordion-down 0.2s ease-out",
                "accordion-up": "accordion-up 0.2s ease-out",
            },
        },
    },
    plugins: [tailwindcssAnimate, typography],
};
