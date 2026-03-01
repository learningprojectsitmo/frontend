import React, { useEffect, useState } from "react";
import type { IconProps } from "./icons.types";
import { iconImports } from "./icons.constants";

export const Icon: React.FC<IconProps> = ({
    name,
    size = 24,
    width,
    height,
    className = "",
    alt,
    color,
}) => {
    const [IconComponent, setIconComponent] = useState<React.ComponentType<
        React.SVGProps<SVGSVGElement>
    > | null>(null);
    const [error, setError] = useState<boolean>(false);

    useEffect(() => {
        let isMounted = true;

        const loadIcon = async () => {
            try {
                const importFn = iconImports[name];
                if (!importFn) {
                    if (isMounted) setError(true);
                    return;
                }

                const module = await importFn();
                if (isMounted) {
                    setIconComponent(() => module.default);
                    setError(false);
                }
            } catch {
                if (isMounted) setError(true);
            }
        };

        loadIcon();

        return () => {
            isMounted = false;
        };
    }, [name]);

    // Определяем размеры: если заданы width/height - используем их, иначе size
    const iconWidth = width || size;
    const iconHeight = height || size;

    if (error) {
        return (
            <span
                className={className}
                style={{
                    width: iconWidth,
                    height: iconHeight,
                    display: "inline-block",
                    backgroundColor: "#f0f0f0",
                    borderRadius: "4px",
                }}
                title={`Icon "${name}" not found`}
            />
        );
    }

    if (!IconComponent) {
        return (
            <span
                className={className}
                style={{
                    width: iconWidth,
                    height: iconHeight,
                    display: "inline-block",
                    backgroundColor: "#f0f0f0",
                    borderRadius: "4px",
                    animation: "pulse 1.5s infinite",
                }}
            />
        );
    }

    return (
        <span
            style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: iconWidth,
                height: iconHeight,
            }}
            className={className}
            role="img"
            aria-label={alt || name}
        >
            <IconComponent
                width="100%"
                height="100%"
                preserveAspectRatio="xMidYMid meet"
                focusable="false"
                aria-hidden="true"
                color={color}
            />
        </span>
    );
};

export default Icon;
