import * as React from "react";

type Theme = "light" | "dark";

type ThemeProviderProps = {
    children: React.ReactNode;
    defaultTheme?: Theme;
};

type ThemeContextValue = {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    toggleTheme: (point?: { x: number; y: number } | null) => void;
};

const ThemeContext = React.createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = "app-theme";

const getInitialTheme = (fallback: Theme): Theme => {
    try {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (stored === "light" || stored === "dark") return stored;
    } catch {
        // ignore
    }
    try {
        if (window.matchMedia("(prefers-color-scheme: dark)").matches) return "dark";
    } catch {
        // ignore
    }
    return fallback;
};

type Point = { x: number; y: number };

const applyTheme = (theme: Theme) => {
    const root = document.documentElement;
    if (theme === "dark") {
        root.classList.add("dark");
    } else {
        root.classList.remove("dark");
    }
    root.style.colorScheme = theme;
};

export const ThemeProvider = ({ children, defaultTheme = "light" }: ThemeProviderProps) => {
    const [theme, setThemeState] = React.useState<Theme>(() => getInitialTheme(defaultTheme));
    const themeRef = React.useRef(theme);

    React.useEffect(() => {
        themeRef.current = theme;
    }, [theme]);

    React.useLayoutEffect(() => {
        applyTheme(theme);
    }, [theme]);

    const setTheme = React.useCallback((next: Theme) => {
        try {
            window.localStorage.setItem(STORAGE_KEY, next);
        } catch {
            // ignore
        }
        setThemeState(next);
    }, []);

    const toggleTheme = React.useCallback((_point?: Point | null) => {
        const next: Theme = themeRef.current === "dark" ? "light" : "dark";
        try {
            window.localStorage.setItem(STORAGE_KEY, next);
        } catch {
            // ignore
        }
        applyTheme(next);
        setThemeState(next);
    }, []);

    const value = React.useMemo(
        () => ({ theme, setTheme, toggleTheme }),
        [theme, setTheme, toggleTheme],
    );

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextValue => {
    const ctx = React.useContext(ThemeContext);
    if (!ctx) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }
    return ctx;
};
