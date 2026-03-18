import * as React from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/utils/cn";

export interface SearchBarProps extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "onChange"
> {
    value?: string;
    onChange?: (value: string) => void;
    onSearch?: (value: string) => void;
    suggestions?: string[];
}

const escapeRegExp = (string: string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

const HighlightMatch = ({ text, highlight }: { text: string; highlight: string }) => {
    if (!highlight) return <span className="text-[#0A0A0A] font-medium font-sans">{text}</span>;

    const parts = text.split(new RegExp(`(${escapeRegExp(highlight)})`, "gi"));
    return (
        <span>
            {parts.map((part, i) =>
                part.toLowerCase() === highlight.toLowerCase() ? (
                    <strong key={i} className="font-bold text-black font-sans">
                        {part}
                    </strong>
                ) : (
                    <span key={i} className="text-[#0A0A0A] font-normal font-sans">
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
            suggestions = [],
            placeholder = "Ищите проекты, пространства или участников...",
            disabled,
            ...props
        },
        forwardedRef,
    ) => {
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

        const filteredSuggestions = React.useMemo(() => {
            if (!internalValue) return [];
            return suggestions.filter((item) =>
                item.toLowerCase().includes(internalValue.toLowerCase()),
            );
        }, [suggestions, internalValue]);

        const showSuggestions =
            isFocused && internalValue.length > 0 && filteredSuggestions.length > 0;

        const firstSuggestion = showSuggestions ? filteredSuggestions[0] : "";
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
                setSelectedIndex((prev) =>
                    prev < filteredSuggestions.length - 1 ? prev + 1 : prev,
                );
            } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
            } else if (e.key === "Enter") {
                e.preventDefault();
                const selectedText =
                    selectedIndex >= 0 ? filteredSuggestions[selectedIndex] : internalValue;
                setInternalValue(selectedText);
                onChange?.(selectedText);
                onSearch?.(selectedText);
                setIsFocused(false);
            }
        };

        return (
            <div ref={wrapperRef} className={cn("relative w-full h-9 z-50", className)}>
                <div
                    className={cn(
                        "absolute top-0 left-0 w-full flex flex-col transition-all duration-200 z-[100] overflow-hidden rounded-[12px] border",
                        disabled
                            ? "bg-[--input-disabled-bg] border-transparent opacity-70"
                            : isFocused
                              ? "border-[--color-blue-primary] shadow-[0_0_0_3px_var(--color-blue-15)] ring-1 ring-[--color-blue-primary] bg-[#F4F5F8]"
                              : "bg-[#F4F5F8] border-transparent hover:bg-gray-200/50",
                    )}
                >
                    <div
                        className={cn(
                            "flex items-center h-9 px-4 shrink-0 transition-colors",
                            isFocused ? "bg-white" : "bg-transparent",
                        )}
                    >
                        <Search
                            className={cn(
                                "shrink-0 transition-colors z-10 text-sans",
                                isFocused ? "text-[#0A0A0A]" : "text-[--color-gray-400]",
                            )}
                            size={18}
                        />

                        <div className="relative flex-1 h-full flex items-center ml-2.5">
                            {showGhostText && (
                                <div className="absolute inset-0 flex items-center pointer-events-none text-[14px] text-sans whitespace-pre">
                                    <span className="opacity-0">{internalValue}</span>
                                    <span className="text-[--color-gray-400]">
                                        {ghostTextRemainder}
                                    </span>
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
                                    "relative z-10 w-full bg-transparent border-none outline-none font-medium font-sans text-[14px] text-[#717182]",
                                    "placeholder:text-[--color-gray-400]",
                                )}
                                onKeyDown={handleKeyDown}
                                {...props}
                            />
                        </div>

                        {internalValue && !disabled && (
                            <button
                                type="button"
                                onClick={handleClear}
                                className="shrink-0 text-[--color-gray-400] hover:text-[#0A0A0A] transition-colors focus:outline-none p-1 ml-1"
                            >
                                <X size={18} />
                            </button>
                        )}
                    </div>
                </div>            
                {showSuggestions && (
                    <ul className="flex flex-col pt-9 max-h-64 overflow-y-auto absolute left-0 right-0 mt-1 bg-gray-50 border border-gray-300 rounded-[12px] shadow-lg">
                        {filteredSuggestions.map((suggestion, index) => (
                            <li
                                key={index}
                                onMouseEnter={() => setSelectedIndex(index)}
                                onClick={() => {
                                    setInternalValue(suggestion);
                                    onChange?.(suggestion);
                                    onSearch?.(suggestion);
                                    setIsFocused(false);
                                }}
                                className={cn(
                                    "pl-[46px] pr-4 py-2.5 text-[14px] text-sans cursor-pointer transition-colors",
                                    selectedIndex === index
                                        ? "bg-gray-200/60"
                                        : "hover:bg-gray-200/40",
                                )}
                            >
                                <HighlightMatch text={suggestion} highlight={internalValue} />
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        );
    },
);

SearchBar.displayName = "SearchBar";
