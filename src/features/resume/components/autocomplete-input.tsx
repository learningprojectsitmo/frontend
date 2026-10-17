import { useEffect, useRef, useState } from "react";
import { LIMITS } from "@/features/resume/validation";

type Props = {
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
    suggestions: string[];
    isDuplicate?: boolean;
    onEnter?: () => void;
    maxLength?: number;
    autoFocus?: boolean;
};

export const AutocompleteInput = ({
    value,
    onChange,
    placeholder,
    suggestions,
    isDuplicate,
    onEnter,
    maxLength = LIMITS.name,
    autoFocus,
}: Props) => {
    const [isOpen, setIsOpen] = useState(false);
    const [highlighted, setHighlighted] = useState(-1);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        setHighlighted(-1);
    }, [suggestions]);

    const showList = isOpen && suggestions.length > 0;

    const selectSuggestion = (suggestion: string) => {
        onChange(suggestion);
        setIsOpen(false);
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "ArrowDown") {
            event.preventDefault();
            setIsOpen(true);
            setHighlighted((prev) => Math.min(prev + 1, suggestions.length - 1));
        } else if (event.key === "ArrowUp") {
            event.preventDefault();
            setHighlighted((prev) => Math.max(prev - 1, -1));
        } else if (event.key === "Enter") {
            if (highlighted >= 0 && suggestions[highlighted]) {
                event.preventDefault();
                selectSuggestion(suggestions[highlighted]);
            } else {
                onEnter?.();
            }
        } else if (event.key === "Escape") {
            setIsOpen(false);
        }
    };

    return (
        <div ref={containerRef} className="relative">
            <input
                value={value}
                onChange={(event) => {
                    onChange(event.target.value);
                    setIsOpen(true);
                }}
                onFocus={() => setIsOpen(true)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                maxLength={maxLength}
                autoFocus={autoFocus}
                autoComplete="off"
                className={`w-full text-sm px-3 py-2 rounded-lg border bg-app-surface text-app-text outline-none ${
                    isDuplicate
                        ? "border-red-400 focus:border-red-400"
                        : "border-app-border focus:border-app-blue"
                }`}
            />
            {showList && (
                <ul className="absolute z-10 mt-1 w-full max-h-48 overflow-auto rounded-lg border border-app-border bg-app-surface shadow-lg">
                    {suggestions.map((suggestion, index) => (
                        <li
                            key={suggestion}
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => selectSuggestion(suggestion)}
                            onMouseEnter={() => setHighlighted(index)}
                            className={`px-3 py-2 text-sm text-app-text cursor-pointer ${
                                index === highlighted ? "bg-app-ghost" : "hover:bg-app-ghost"
                            }`}
                        >
                            {suggestion}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};
