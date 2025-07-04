import {
    Slash,
    SlashCmd,
    SlashCmdProvider,
    createSuggestionsItems,
} from "@harshtalks/slash-tiptap";

import "./style.css";

import { Heading, List, ListOrdered, Type, Table } from 'lucide-react'

export const SlashExtension = Slash.extend({
    suggestion: {
        items: () => suggestions,
    },
});

export const suggestions = createSuggestionsItems([
    {
        title: "Heading",
        searchTerms: ["heading"],
        command: ({ editor, range }) => {
            editor
                .chain()
                .focus()
                .deleteRange(range)
                .toggleHeading({ level: 1 })
                .run();
        },
    },
    {
        title: "Text",
        searchTerms: ["paragraph"],
        command: ({ editor, range }) => {
            editor
                .chain()
                .focus()
                .deleteRange(range)
                .toggleNode("paragraph", "paragraph")
                .run();
        },
    },
    {
        title: "Bullet List",
        searchTerms: ["unordered", "point"],
        command: ({ editor, range }) => {
            editor.chain().focus().deleteRange(range).toggleBulletList().run();
        },
    },
    {
        title: "Ordered List",
        searchTerms: ["ordered", "point", "numbers"],
        command: ({ editor, range }) => {
            editor.chain().focus().deleteRange(range).toggleOrderedList().run();
        },
    },
    {
        title: "Table",
        searchTerms: ["table", "grid"],
        command: ({ editor, range }) => {
            editor.chain().focus().deleteRange(range).insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
        },
    },
]);

function Icon({ title }) {
    switch (title) {
        case "Heading":
            return <Heading />;
        case "Text":
            return <Type />;
        case "Bullet List":
            return <List />;
        case "Ordered List":
            return <ListOrdered />;
        case "Table":
            return <Table />;
        default:
            return null;
    }
}

export function SlashElement({ editor }) {
    return (
        <SlashCmd.Root editor={editor}>
            <SlashCmd.Cmd>
                <SlashCmd.List>
                    {suggestions.map((item) => {
                        return (
                            <SlashCmd.Item
                                value={item.title}
                                onCommand={(val) => {
                                    item.command(val);
                                }}
                                key={item.title}
                            >
                                <div className="slash-extension-item">
                                    <Icon title={item.title} />
                                    <span>{item.title}</span>
                                </div>
                            </SlashCmd.Item>
                        );
                    })}
                </SlashCmd.List>
            </SlashCmd.Cmd>
        </SlashCmd.Root>
    );
}

export function SlashProvider({ children }) {
    return (
        <SlashCmdProvider>
            {children}
        </SlashCmdProvider>
    );
}