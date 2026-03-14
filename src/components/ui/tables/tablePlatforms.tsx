import type { Platform } from "@/types/tables/forTables";

interface TablePlatformsProps {
    headerList: string[];
    platforms: Platform[];
    showMore: (platform: Platform) => void;
}

export const TablePlatforms = ({ headerList, platforms, showMore }: TablePlatformsProps) => {
    return (
        <div className="w-full overflow-hidden rounded-2xl border border-gray-200 bg-white">
            <table className="w-full text-left">
                <thead className="bg-gray-50 text-[#0A0A0A] text-black-500 border-b border-gray-200">
                    <tr>
                        {headerList.map((header) => (
                            <th className="px-6 py-4 text-[17px]">{header}</th>
                        ))}
                    </tr>
                </thead>

                <tbody className="divide-y divide-gray-200">
                    {platforms.map((platform) => (
                        <tr className="hover:bg-gray-50 transition">
                            <td className="px-6 py-4 text-[#0A0A0A] text-[15px] font-semibold">
                                {platform.name}
                            </td>
                            <td className="px-6 py-4 text-[#4A5565] text-[15px] font-regular">
                                {platform.description}
                            </td>
                            <td className="px-6 py-4">
                                <div className="bg-blue-500 rounded-xl px-1 py-1 text-[13px] font-semibold text-white text-center flex items-center justify-center">
                                    {platform.status}
                                </div>
                            </td>
                            <td className="px-6 py-4 text-[#0A0A0A] text-[15px]">{`${platform.progressInPercent}%`}</td>
                            <td className="px-6 py-4 text-[#0A0A0A] text-[15px]">{platform.due}</td>
                            <td className="px-6 py-4 gap-2 flex flex-row flex-wrap">
                                {platform.tags.map((tag) => (
                                    <div className=" bg-gray-200 rounded-xl px-2 text-black font-semibold text-[13px] flex items-center justify-center">
                                        {tag}
                                    </div>
                                ))}
                            </td>
                            <td className="px-6 py-4 text-[#0A0A0A] text-[15px]">
                                {platform.members}
                            </td>
                            <td className="px-6 py-4">
                                <button
                                    onClick={() => showMore(platform)}
                                    className="font-medium text-gray-700 font-medium hover:text-gray-800 text-[15px]"
                                >
                                    ...
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
