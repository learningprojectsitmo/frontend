// hooks/useSpaceSearch.ts
export function useSpaceSearch() {
    const [search, setSearch] = useState("");
    const debouncedSearch = useDebounce(search);
    const { data: suggestions, isLoading } = useQuery({
        queryKey: ["suggestions", debouncedSearch],
        queryFn: () => getSuggestions(debouncedSearch),
        enabled: !!debouncedSearch && debouncedSearch.length > 2,
        staleTime: 5000,
    });

    return {
        search,
        setSearch,
        suggestions: suggestions || [],
        isLoadingSuggestions: isLoading,
    };
}
