import { useEffect, useState, useRef, useMemo } from "react";
import { computePosition, offset, flip, shift } from "@floating-ui/dom";
import { Menu, Item, Separator, Submenu, useContextMenu } from "react-contexify";
import "react-contexify/ReactContexify.css";
import "./style.css";

import { 
    ChevronDown, 
    Palette, 
    Plus,
    Eraser,
    Minus,
    Trash2,
    Rows
} from "lucide-react";

export default function TablePanel({ editor }) {
    const [showTableMenu, setShowTableMenu] = useState(false);
    const tableMenuRef = useRef();
    const tableRef = useRef();

    const [showTableCellMenu, setShowTableCellMenu] = useState(false);
    const tableCellMenuRef = useRef();
    const tableCellRef = useRef();

    const tableUpdateAnimationRef = useRef();
    const tableCellUpdateAnimationRef = useRef();
    const resizeObserverRef = useRef();

    const [hovering, setHovering] = useState({});

    const { show: showContextMenu } = useContextMenu({
        id: "table-cell-context-menu",
    });

    function hover(id) {
        setHovering(prev => ({ ...prev, [id]: true }));
    }

    function cleanHover(id) {
        setHovering(prev => {
            const newHovering = { ...prev };
            delete newHovering[id];
            return newHovering;
        });
    }

    function handleIconClick(event) {
        event.preventDefault();
        event.stopPropagation();

        showContextMenu({
            event,
            props: {
                editor,
            },
        });
    }

    function handleContextMenuItemClick(data) {
        const { editor } = data.event.props;

        const { props } = data;

        console.log(data);

        switch (data.type) {
            case 'add-column-before':
                editor.chain().focus().addColumnBefore().run();
                break;
            case 'add-column-after':
                editor.chain().focus().addColumnAfter().run();
                break;
            case 'delete-column':
                editor.chain().focus().deleteColumn().run();
                break;
            case 'add-row-before':
                editor.chain().focus().addRowBefore().run();
                break;
            case 'add-row-after':
                editor.chain().focus().addRowAfter().run();
                break;
            case 'delete-row':
                editor.chain().focus().deleteRow().run();
                break;
            case 'delete-table':
                editor.chain().focus().deleteTable().run();
                break;
            case 'clear-cell':
                const activeCell = getActiveCell();

                if (!activeCell) return;

                editor.chain().focus().command(({ tr }) => {
                    const { pos, node } = activeCell;
                    const from = pos + 1;
                    const to = pos + node.nodeSize - 1;
                    tr.delete(from, to);
                    return true;
                }).run();
                break;
            case 'update-cell-bg':
                const { color } = props;

                editor.chain().focus().setCellAttribute('backgroundColor', color).run();

                break;
        }
    }

    function getTable() {
        if (!editor) return;

        if (editor.isActive("table")) {
            const { state } = editor;
            const { $from } = state.selection;
            let foundTablePos = null;

            for (let depth = $from.depth; depth > 0; depth--) {
                const node = $from.node(depth);
                if (node.type.name === "table") {
                    foundTablePos = $from.before(depth);

                    break;
                }
            }
            if (!foundTablePos) return;

            const tableEl = editor.view.nodeDOM(foundTablePos);

            return tableEl;
        }

        return null;
    }

    function getActiveCell() {
        if (!editor) return null;

        const { state } = editor;
        const { $from } = state.selection;
        let foundCellPos = null;

        for (let depth = $from.depth; depth > 0; depth--) {
            const node = $from.node(depth);
            if (node.type.name === "tableCell" || node.type.name === "tableHeader") {
                foundCellPos = $from.before(depth);
                break;
            }
        }

        if (foundCellPos == null) return null;

        const cellEl = editor.view.nodeDOM(foundCellPos);

        return {
            pos: foundCellPos,
            node: editor.state.doc.nodeAt(foundCellPos),
            dom: cellEl,
        };
    }

    function handleCopyTable() {
        if (!editor) return;

        const tableEl = getTable();
        if (!tableEl) return;

        const tableHTML = tableEl.outerHTML;
        navigator.clipboard.writeText(tableHTML).then(() => {
            console.log('Table copied to clipboard');
        }).catch(err => {
            console.error('Failed to copy table:', err);
        });
    }

    const updateTableMenuPosition = async () => {
        if (!tableRef.current || !tableMenuRef.current) return;

        const { x, y } = await computePosition(tableRef.current, tableMenuRef.current, {
            placement: "bottom",
            middleware: [offset(8), flip(), shift()],
        });

        Object.assign(tableMenuRef.current.style, {
            left: `${x}px`,
            top: `${y}px`,
        });
    };

    const updateTableCellMenuPosition = async () => {
        if (!tableCellRef.current || !tableCellMenuRef.current) return;

        const { x, y } = await computePosition(tableCellRef.current, tableCellMenuRef.current, {
            placement: "right-start",
            middleware: [offset({ mainAxis: -25, crossAxis: 5 }), shift()],
        });

        Object.assign(tableCellMenuRef.current.style, {
            left: `${x}px`,
            top: `${y}px`,
        });
    };

    const startTableMenuAutoUpdate = () => {
        if (tableUpdateAnimationRef.current) {
            cancelAnimationFrame(tableUpdateAnimationRef.current);
        }
        
        const updateTableMenu = () => {
            if (showTableMenu && tableRef.current && tableMenuRef.current) {
                updateTableMenuPosition();
            }
            tableUpdateAnimationRef.current = requestAnimationFrame(updateTableMenu);
        };
        
        tableUpdateAnimationRef.current = requestAnimationFrame(updateTableMenu);
    };

    const startTableCellMenuAutoUpdate = () => {
        if (tableCellUpdateAnimationRef.current) {
            cancelAnimationFrame(tableCellUpdateAnimationRef.current);
        }
        
        const updateTableCellMenu = () => {
            if (showTableCellMenu && tableCellRef.current && tableCellMenuRef.current) {
                updateTableCellMenuPosition();
            }
            tableCellUpdateAnimationRef.current = requestAnimationFrame(updateTableCellMenu);
        };
        
        tableCellUpdateAnimationRef.current = requestAnimationFrame(updateTableCellMenu);
    };

    const stopTableMenuAutoUpdate = () => {
        if (tableUpdateAnimationRef.current) {
            cancelAnimationFrame(tableUpdateAnimationRef.current);
            tableUpdateAnimationRef.current = null;
        }
    };

    const stopTableCellMenuAutoUpdate = () => {
        if (tableCellUpdateAnimationRef.current) {
            cancelAnimationFrame(tableCellUpdateAnimationRef.current);
            tableCellUpdateAnimationRef.current = null;
        }
    };

    const setupResizeObserver = () => {
        if (resizeObserverRef.current) {
            resizeObserverRef.current.disconnect();
        }

        resizeObserverRef.current = new ResizeObserver(() => {
            if (showTableMenu) {
                updateTableMenuPosition();
            }
            if (showTableCellMenu) {
                updateTableCellMenuPosition();
            }
        });

        if (tableRef.current) {
            resizeObserverRef.current.observe(tableRef.current);
        }
        if (tableCellRef.current) {
            resizeObserverRef.current.observe(tableCellRef.current);
        }
    };

    const cleanupResizeObserver = () => {
        if (resizeObserverRef.current) {
            resizeObserverRef.current.disconnect();
            resizeObserverRef.current = null;
        }
    };

    function setupTableMenu() {
        if (editor.isActive("table")) {
            const tableEl = getTable();

            if (!tableEl) {
                cleanupTableMenu();
                return;
            }

            tableRef.current = tableEl;
            setShowTableMenu(true);
            updateTableMenuPosition();
            startTableMenuAutoUpdate();
            setupResizeObserver();
        } else {
            cleanupTableMenu()
        }
    }

    function cleanupTableMenu() {
        setShowTableMenu(false);
        stopTableMenuAutoUpdate();
    }

    function setupTableCellMenu() {
        if (editor.isActive("tableCell") || editor.isActive("tableHeader")) {
            const tableCellEl = getActiveCell();

            if (!tableCellEl) {
                cleanupTableCellMenu();
                return;
            }

            tableCellRef.current = tableCellEl.dom;
            setShowTableCellMenu(true);
            updateTableCellMenuPosition();
            startTableCellMenuAutoUpdate();
            setupResizeObserver();
        } else {
            cleanupTableCellMenu();
        }
    }

    function cleanupTableCellMenu() {
        setShowTableCellMenu(false);
        stopTableCellMenuAutoUpdate();
    }

    useEffect(() => {
        if (!editor) return;

        const update = () => {
            setupTableMenu();
            setupTableCellMenu();
        };

        editor.on("transaction", update);

        const handleResize = () => {
            if (showTableMenu) {
                updateTableMenuPosition();
            }
            if (showTableCellMenu) {
                updateTableCellMenuPosition();
            }
        };

        window.addEventListener('resize', handleResize);

        return () => {
            editor.off("transaction", update);
            window.removeEventListener('resize', handleResize);
            stopTableMenuAutoUpdate();
            stopTableCellMenuAutoUpdate();
            cleanupResizeObserver();
        };
    }, [editor, showTableMenu, showTableCellMenu]);

    const tableUid = useMemo(() => {
        if (tableRef.current) {
            return tableRef.current.getAttribute('data-uid');
        }
        return null;
    }, [tableRef.current]);

    const tableActiveCellUid = useMemo(() => {
        if (tableCellRef.current) {
            return tableCellRef.current.getAttribute('data-uid');
        }
        return null;
    }, [tableCellRef.current]);

    return (
        <>
            <style>
                {hovering['delete-table'] && `
                    table:has(td[data-uid="${tableActiveCellUid}"]) {
                        outline: 3px solid red !important;

                        th, td {
                            background-color: #f8b9b9 !important;
                        }
                    }
                    table:has(th[data-uid="${tableActiveCellUid}"]) {
                        outline: 3px solid red !important;

                        th, td {
                            background-color: #f8b9b9 !important;
                        }
                    }
                `}
            </style>
            <div
                ref={tableMenuRef}
                style={{
                    display: showTableMenu ? "flex" : "none",
                    position: "absolute",
                    zIndex: 1000,
                }}
                className="table-panel"
            >
                <button onClick={() => editor.chain().focus().addRowAfter().run()}>
                    <Rows size={16} />
                    New row
                </button>
                <button onClick={() => editor.chain().focus().deleteTable().run()} onMouseEnter={() => hover("delete-table")} onMouseLeave={() => cleanHover("delete-table")}>
                    <Trash2 size={16} />
                    Delete table
                </button>
            </div>

            <div
                ref={tableCellMenuRef}
                style={{
                    display: showTableCellMenu ? "block" : "none",
                    position: "absolute",
                    zIndex: 1000,
                }}
                className="table-cell-panel"
            >
                <div className="icon">
                    <ChevronDown
                        onClick={handleIconClick}
                    />
                </div>
            </div>

            <Menu id="table-cell-context-menu" className="table-cell-context-menu">
                <Submenu label={
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Palette size={16} />
                        Background color
                    </span>
                }>
                    <Item onClick={e => handleContextMenuItemClick({ event: e, type: 'update-cell-bg', props: { color: null } })}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Eraser size={16} />
                            None
                        </span>
                    </Item>
                    <Item onClick={e => handleContextMenuItemClick({ event: e, type: 'update-cell-bg', props: { color: '#fff9c4' } })}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ background: '#fff9c4', borderRadius: 3, padding: '0 8px', marginRight: 0, width: 16, height: 16 }}></span>
                            Yellow
                        </span>
                    </Item>
                    <Item onClick={e => handleContextMenuItemClick({ event: e, type: 'update-cell-bg', props: { color: '#c8e6c9' } })}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ background: '#c8e6c9', borderRadius: 3, padding: '0 8px', marginRight: 0, width: 16, height: 16 }}></span>
                            Green
                        </span>
                    </Item>
                    <Item onClick={e => handleContextMenuItemClick({ event: e, type: 'update-cell-bg', props: { color: '#bbdefb' } })}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ background: '#bbdefb', borderRadius: 3, padding: '0 8px', marginRight: 0, width: 16, height: 16 }}></span>
                            Blue
                        </span>
                    </Item>
                    <Item onClick={e => handleContextMenuItemClick({ event: e, type: 'update-cell-bg', props: { color: '#ffcdd2' } })}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ background: '#ffcdd2', borderRadius: 3, padding: '0 8px', marginRight: 0, width: 16, height: 16 }}></span>
                            Red
                        </span>
                    </Item>
                </Submenu>
                <Separator />
                <Item onClick={e => handleContextMenuItemClick({ event: e, type: 'add-column-after' })}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Plus size={16} />
                        Add column right
                    </span>
                </Item>
                <Item onClick={e => handleContextMenuItemClick({ event: e, type: 'add-row-after' })}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Plus size={16} />
                        Add row below
                    </span>
                </Item>
                <Item onClick={e => handleContextMenuItemClick({ event: e, type: 'clear-cell' })}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Eraser size={16} />
                        Clear cell
                    </span>
                </Item>
                <Item onClick={e => handleContextMenuItemClick({ event: e, type: 'delete-column' })} onMouseEnter={() => hover("delete-column")} onMouseLeave={() => cleanHover("delete-column")}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Minus size={16} />
                        Delete column
                    </span>
                </Item>
                <Item onClick={e => handleContextMenuItemClick({ event: e, type: 'delete-row' })}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Minus size={16} />
                        Delete row
                    </span>
                </Item>
            </Menu>
        </>
    );
}
