import * as React from "react";
import { Root, Input, HiddenInput } from "@radix-ui/react-one-time-password-field";
import { cn } from "@/utils/cn";

type OTPFieldDemoProps = React.ComponentPropsWithoutRef<typeof Root> & {
    error?: boolean;
};

const OTPFieldDemo: React.FC<OTPFieldDemoProps> = ({ error, ...props }) => {
    return (
        <Root {...props}>
            <div className="flex flex-nowrap gap-2 justify-center font-sans font-medium text-subheading">
                {Array.from({ length: 6 }).map((_, index) => (
                    <Input
                        key={index}
                        index={index}
                        className={cn(
                            "box-border inline-flex h-20 w-16 appearance-none items-center justify-center rounded-2xl border bg-white text-center text-gray-900 shadow-sm outline-none",
                            error
                                ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-200"
                                : "border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200",
                        )}
                    />
                ))}
            </div>
            <HiddenInput />
        </Root>
    );
};

export { OTPFieldDemo };
