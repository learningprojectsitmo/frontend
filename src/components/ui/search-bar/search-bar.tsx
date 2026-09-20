import * as React from "react";
import { Search, X, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router";
import { cn } from "@/utils/cn";

export type SuggestionItem = {
    text: string;
    href?: string;
    meta?: string;
};

export type SuggestionGroup = {
    id: string;
    label: string;
    items: SuggestionItem[];
};

export interface SearchBarProps extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "onChange"
> {
    value?: string;
    onChange?: (value: string) => void;
    onSearch?: (value: string) => void;
    suggestions?: SuggestionGroup[];
    onItemClick?: (item: SuggestionItem) => void;
}

const escapeRegExp = (string: string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

const HighlightMatch = ({ text, highlight }: { text: string; highlight: string }) => {
    if (!highlight) return <span className="text-app-text font-medium font-sans">{text}</span>;

    const parts = text.split(new RegExp(`(${escapeRegExp(highlight)})`, "gi"));
    return (
        <span>
            {parts.map((part, i) =>
                part.toLowerCase() === highlight.toLowerCase() ? (
                    <strong key={i} className="font-bold text-app-text font-sans">
                        {part}
                    </strong>
                ) : (
                    <span key={i} className="text-app-text font-normal font-sans">
                        {part}
                    </span>
                ),
            )}
        </span>
    );
};

export const SearchBar = React.forwardRef<HTMLInputElement, SearchBarProps>(
    (
        {
            className,
            value,
            onChange,
            onSearch,
            onItemClick,
            suggestions = [],
            placeholder = "Ищите проекты, пространства или участников...",
            disabled,
            ...props
        },
        forwardedRef,
    ) => {
        const navigate = useNavigate();
        const [internalValue, setInternalValue] = React.useState(value || "");
        const [isFocused, setIsFocused] = React.useState(false);
        const [selectedIndex, setSelectedIndex] = React.useState(-1);

        const wrapperRef = React.useRef<HTMLDivElement>(null);
        const internalInputRef = React.useRef<HTMLInputElement | null>(null);

        const setRefs = React.useCallback(
            (node: HTMLInputElement) => {
                internalInputRef.current = node;
                if (typeof forwardedRef === "function") {
                    forwardedRef(node);
                } else if (forwardedRef) {
                    forwardedRef.current = node;
                }
            },
            [forwardedRef],
        );

        React.useEffect(() => {
            if (value !== undefined) setInternalValue(value);
        }, [value]);

        React.useEffect(() => {
            function handleClickOutside(event: MouseEvent | TouchEvent) {
                if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                    setIsFocused(false);
                }
            }
            document.addEventListener("mousedown", handleClickOutside);
            document.addEventListener("touchstart", handleClickOutside);
            return () => {
                document.removeEventListener("mousedown", handleClickOutside);
                document.removeEventListener("touchstart", handleClickOutside);
            };
        }, []);

        const visibleGroups = React.useMemo(() => {
            if (!internalValue) return [];
            const q = internalValue.toLowerCase();
            return suggestions
                .map((group) => ({
                    ...group,
                    items: group.items.filter((item) => item.text.toLowerCase().includes(q)),
                }))
                .filter((group) => group.items.length > 0);
        }, [suggestions, internalValue]);

        const flatItems = React.useMemo(
            () => visibleGroups.flatMap((group) => group.items),
            [visibleGroups],
        );

        // Смещение старта каждой группы во flatten-списке для клавиатурной навигации
        const groupsWithOffset = React.useMemo(() => {
            let running = 0;
            return visibleGroups.map((group) => {
                const start = running;
                running += group.items.length;
                return { ...group, start };
            });
        }, [visibleGroups]);

        const showSuggestions = isFocused && internalValue.length > 0 && flatItems.length > 0;

        const firstSuggestion = showSuggestions ? flatItems[0].text : "";
        const showGhostText =
            isFocused &&
            internalValue &&
            firstSuggestion.toLowerCase().startsWith(internalValue.toLowerCase());
        const ghostTextRemainder = showGhostText ? firstSuggestion.slice(internalValue.length) : "";

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const newValue = e.target.value;
            setInternalValue(newValue);
            onChange?.(newValue);
            setSelectedIndex(-1);
        };

        const handleClear = () => {
            setInternalValue("");
            onChange?.("");
            setSelectedIndex(-1);
            internalInputRef.current?.focus();
        };

        const selectItem = (item: SuggestionItem) => {
            setIsFocused(false);
            if (item.href) {
                navigate(item.href);
                return;
            }
            setInternalValue(item.text);
            onChange?.(item.text);
            onItemClick?.(item);
            onSearch?.(item.text);
        };

        const handleSuggestionClick = (item: SuggestionItem) => {
            selectItem(item);
        };

        const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === "Tab" && showGhostText) {
                e.preventDefault();
                setInternalValue(firstSuggestion);
                onChange?.(firstSuggestion);
                return;
            }

            if (!showSuggestions) {
                if (e.key === "Enter") {
                    onSearch?.(internalValue);
                    setIsFocused(false);
                }
                return;
            }

            if (e.key === "ArrowDown") {
                e.preventDefault();
                setSelectedIndex((prev) => (prev < flatItems.length - 1 ? prev + 1 : prev));
            } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
            } else if (e.key === "Enter") {
                e.preventDefault();
                const active =
                    selectedIndex >= 0 ? (flatItems[selectedIndex] ?? flatItems[0]) : flatItems[0];
                selectItem(active);
            } else if (e.key === "Escape") {
                setIsFocused(false);
            }
        };

        return (
            <div ref={wrapperRef} className={cn("relative w-full h-9", className)}>
                <div
                    className={cn(
                        "absolute top-0 left-0 w-full flex flex-col transition-all duration-200 z-[100] overflow-hidden rounded-[12px] border",
                        disabled
                            ? "bg-[--input-disabled-bg] border-transparent opacity-70"
                            : isFocused
                              ? "border-[--color-blue-primary] shadow-[0_0_0_3px_var(--color-blue-15)] ring-1 ring-[--color-blue-primary] bg-app-surface"
                              : "bg-app-ghost border-transparent hover:bg-gray-200/50",
                    )}
                >
                    <div
                        className={cn(
                            "flex items-center h-9 px-4 shrink-0 transition-colors",
                            isFocused ? "bg-app-surface" : "bg-transparent",
                        )}
                    >
                        <Search
                            className={cn(
                                "shrink-0 transition-colors z-10 text-sans",
                                isFocused ? "text-app-text" : "text-app-muted",
                            )}
                            size={18}
                        />

                        <div className="relative flex-1 h-full flex items-center ml-2.5">
                            {showGhostText && (
                                <div className="absolute inset-0 flex items-center pointer-events-none text-[14px] text-sans whitespace-nowrap overflow-hidden">
                                    <span className="opacity-0">{internalValue}</span>
                                    <span className="text-app-muted">{ghostTextRemainder}</span>
                                </div>
                            )}

                            <input
                                ref={setRefs}
                                type="text"
                                value={internalValue}
                                onChange={handleChange}
                                onFocus={() => setIsFocused(true)}
                                placeholder={placeholder}
                                disabled={disabled}
                                className={cn(
                                    "relative z-10 w-full bg-transparent border-none outline-none font-medium font-sans text-[14px] text-app-text",
                                    "placeholder:text-app-muted",
                                )}
                                onKeyDown={handleKeyDown}
                                {...props}
                            />
                        </div>

                        {internalValue && !disabled && (
                            <button
                                type="button"
                                onClick={handleClear}
                                className="shrink-0 text-app-muted hover:text-app-text transition-colors focus:outline-none p-1 ml-1"
                            >
                                <X size={18} />
                            </button>
                        )}
                    </div>
                </div>
                {showSuggestions && (
                    <div className="flex flex-col pt-9 max-h-80 overflow-y-auto absolute left-0 right-0 mt-1 bg-app-surface border border-app-border rounded-[12px] shadow-lg animate-[filter-in_160ms_cubic-bezier(0.16,1,0.3,1)]">
                        {groupsWithOffset.map((group) => (
                            <div key={group.id} className="flex flex-col">
                                <span className="block px-4 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-app-muted font-sans">
                                    {group.label}
                                </span>
                                {group.items.map((item, index) => {
                                    const flatIndex = group.start + index;
                                    return (
                                        <div
                                            key={`${group.id}-${flatIndex}`}
                                            onMouseEnter={() => setSelectedIndex(flatIndex)}
                                            onClick={() => handleSuggestionClick(item)}
                                            className={cn(
                                                "group flex items-center justify-between gap-2 pl-[46px] pr-4 py-2.5 text-[14px] text-sans cursor-pointer transition-colors",
                                                selectedIndex === flatIndex
                                                    ? "bg-app-ghost"
                                                    : "hover:bg-app-ghost",
                                            )}
                                        >
                                            <HighlightMatch
                                                text={item.text}
                                                highlight={internalValue}
                                            />
                                            <span className="flex items-center gap-2 shrink-0">
                                                {item.meta && (
                                                    <span className="text-[12px] text-app-muted">
                                                        {item.meta}
                                                    </span>
                                                )}
                                                {item.href && (
                                                    <ArrowRight
                                                        size={14}
                                                        className="text-app-muted opacity-0 transition-opacity group-hover:opacity-100"
                                                    />
                                                )}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                        <div className="border-t border-app-border-light">
                            <span className="flex items-center gap-1.5 px-4 py-2.5 text-[12px] text-app-muted font-sans">
                                Enter — перейти к выбранному, Esc — закрыть
                            </span>
                        </div>
                    </div>
                )}
            </div>
        );
    },
);

SearchBar.displayName = "SearchBar";
