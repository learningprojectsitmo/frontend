import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Image from "@tiptap/extension-image";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import Link from "@tiptap/extension-link";
import { TextStyle, FontSize } from "@tiptap/extension-text-style";
import { showImagePrompt } from "@/components/image-prompt";
import {
    BlockEditor,
    SlashCommand,
    CodeBlock,
    defaultSlashCommandItems,
    getSlashCommandSuggestion,
} from "@/components/block-editor";
import type { SlashCommandSuggestionItem } from "@/components/block-editor";
import { useEffect } from "react";

interface RichTextEditorProps {
    value: string;
    onChange: (html: string) => void;
    placeholder?: string;
}

const slashItems: SlashCommandSuggestionItem[] = [
    ...defaultSlashCommandItems,
    {
        id: "image",
        title: "Image",
        description: "Вставить изображение",
        keywords: ["image", "img", "picture", "photo", "картинка"],
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
            </svg>
        ),
        command: ({ editor, range }) => {
            showImagePrompt().then((url) => {
                if (!url) return;
                editor.chain().focus().deleteRange(range).setImage({ src: url }).run();
            });
        },
    },
    {
        id: "table",
        title: "Table",
        description: "Вставить таблицу",
        keywords: ["table", "grid", "таблица"],
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <line x1="3" y1="9" x2="21" y2="9" />
                <line x1="3" y1="15" x2="21" y2="15" />
                <line x1="9" y1="3" x2="9" y2="21" />
                <line x1="15" y1="3" x2="15" y2="21" />
            </svg>
        ),
        command: ({ editor, range }) => {
            editor
                .chain().focus()
                .deleteRange(range)
                .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                .run();
        },
    },
];

export const RichTextEditor = ({
    value,
    onChange,
    placeholder = "Введите текст...",
}: RichTextEditorProps) => {
    const editor = useEditor({
        immediatelyRender: false,
        extensions: [
            StarterKit.configure({
                heading: { levels: [1, 2, 3] },
                codeBlock: false,
            }),
            Placeholder.configure({ placeholder }),
            Underline,
            TaskList,
            TaskItem.configure({ nested: true }),
            Image,
            Table.configure({ resizable: true }),
            TableRow,
            TableCell,
            TableHeader,
            TextStyle,
            FontSize,
            Link.configure({
                openOnClick: false,
                autolink: true,
                defaultProtocol: "https",
                protocols: ["http", "https"],
            }),
            CodeBlock,
            SlashCommand.configure({
                suggestion: getSlashCommandSuggestion(slashItems),
            }),
        ],
        content: value,
        onUpdate: ({ editor: e }) => {
            onChange(e.getHTML());
        },
    });

    useEffect(() => {
        if (editor && editor.getHTML() !== value) {
            editor.commands.setContent(value, false);
        }
    }, [value, editor]);

    if (!editor) return null;

    return <BlockEditor editor={editor} />;
};
