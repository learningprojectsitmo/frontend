import * as React from "react";

import { Head } from "../seo";

type ContentLayoutProps = {
    children: React.ReactNode;
    title: string;
};

export const ContentLayout = ({ children, title }: ContentLayoutProps) => {
    return (
        <>
            <Head title={title} />
            <div className="p-8">
                {/* Контейнер теперь просто передает контент, 
            сетку и заголовки мы верстаем внутри страниц */}
                <div className="mx-auto max-w-[1400px]">{children}</div>
            </div>
        </>
    );
};
