import { Helmet, HelmetData } from "react-helmet-async";

type HeadProps = {
    title?: string;
    description?: string;
    /** Путь от корня для canonical, например `/privacy`. */
    path?: string;
    /** Объект schema.org для JSON-LD разметки. */
    jsonLd?: Record<string, unknown>;
};

const helmetData = new HelmetData({});

const origin = typeof window !== "undefined" ? window.location.origin : "https://eduflow.example";

export const Head = ({ title = "", description = "", path, jsonLd }: HeadProps = {}) => {
    const resolvedTitle = title ? `${title} | EduFlow` : "EduFlow";
    const url = path ? `${origin}${path}` : undefined;

    return (
        <Helmet
            helmetData={helmetData}
            title={title ? `${title} | EduFlow` : undefined}
            defaultTitle="EduFlow"
        >
            <meta name="description" content={description} />
            <meta property="og:type" content="website" />
            <meta property="og:site_name" content="EduFlow" />
            <meta property="og:title" content={resolvedTitle} />
            {description ? <meta property="og:description" content={description} /> : null}
            {url ? <meta property="og:url" content={url} /> : null}
            <meta name="twitter:card" content="summary" />
            {url ? <link rel="canonical" href={url} /> : null}
            {jsonLd ? <script type="application/ld+json">{JSON.stringify(jsonLd)}</script> : null}
        </Helmet>
    );
};
