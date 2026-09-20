import { useState } from "react";
import { useSearchParams } from "react-router";
import { ContentLayout } from "@/components/layouts";
import { SearchBar } from "@/components/ui/search-bar/search-bar";
import { SearchResultsPanel } from "@/components/search/search-results";
import { useExtendedSearchResults } from "@/lib/search";

const SearchPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const query = searchParams.get("q") ?? "";
    const [input, setInput] = useState(query);

    const { data, isFetching } = useExtendedSearchResults(query);

    const handleSubmit = (value: string) => {
        const q = value.trim();
        setSearchParams(q ? { q } : {}, { replace: true });
        if (!q) setInput("");
    };

    return (
        <ContentLayout title="Расширенный поиск">
            <div className="mx-auto max-w-5xl p-6">
                <div className="mb-8">
                    <h1 className="mb-1 text-2xl font-bold text-app-text">Расширенный поиск</h1>
                    <p className="text-sm text-app-muted">
                        Полные результаты по проектам, пространствам и участникам
                    </p>
                </div>

                <div className="mb-10">
                    <SearchBar
                        value={input}
                        onChange={setInput}
                        onSearch={handleSubmit}
                        className="max-w-2xl h-11"
                    />
                    <p className="mt-2 text-[13px] text-app-muted">
                        Измените запрос и нажмите Enter, чтобы продолжить поиск
                    </p>
                </div>

                <SearchResultsPanel
                    query={query}
                    results={data}
                    isLoading={isFetching}
                    moreHref={undefined}
                />
            </div>
        </ContentLayout>
    );
};

export default SearchPage;
