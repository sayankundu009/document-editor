import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronRight, FileText, Folder, MoreVertical, Plus, Pencil, Trash2, Copy, Eye } from "lucide-react";

// Drag and drop
import { draggable } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import {
    attachInstruction,
    extractInstruction,
} from '@atlaskit/pragmatic-drag-and-drop-hitbox/tree-item';
import { DropIndicator } from '@atlaskit/pragmatic-drag-and-drop-react-drop-indicator/box';

// Context menu
import { Menu, Item, Separator, Submenu, useContextMenu } from "react-contexify";
import "react-contexify/ReactContexify.css"

import "./style.css";

function recursiveFindNodeAndParent(nodes, id) {
    function callback(node, parent) {
        if (node.id === id) return { node, parent };

        if (node.children) {
            for (const child of node.children) {
                const found = callback(child, node);

                if (found) return found;
            }
        }

        return null;
    }

    for (const node of nodes) {
        const found = callback(node, null);

        if (found) return found;
    }

    return null;
}

function ContextMenu(props) {
    const { menuId, onItemClick, onVisibilityChange } = props;

    function handleItemClick(event, type) {
        onItemClick({ event, type });
    }

    return (
        <Menu id={menuId} onVisibilityChange={onVisibilityChange}>
            {props.folder ? (
                <Item onClick={(event) => handleItemClick(event, 'add-page')}>
                    <Plus size={16} /> New page
                </Item>
            ) : (
                <Item onClick={(event) => handleItemClick(event, 'open')}>
                    <Eye size={16} /> Open
                </Item>
            )}
            <Item onClick={(event) => handleItemClick(event, 'delete')} className="danger">
                <Trash2 size={16} /> Delete
            </Item>
            <Item onClick={(event) => handleItemClick(event, 'rename')}>
                <Pencil size={16} /> Rename
            </Item>
            <Item onClick={(event) => handleItemClick(event, 'copy')}>
                <Copy size={16} /> Copy page link
            </Item>
            <Separator />
            <Submenu label="More">
                <Item>Sub Item 1</Item>
                <Item>Sub Item 2</Item>
            </Submenu>
        </Menu>
    );
}

function NodeInput({ initialValue = '', icon: Icon = FileText, onSubmit, onCancel }) {
    const [value, setValue] = useState(initialValue);
    const inputRef = useRef(null);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    function handleKeyDown(e) {
        if (e.key === 'Enter') {
            const trimmedValue = value.trim();
            if (trimmedValue) {
                onSubmit(trimmedValue);
            } else {
                onCancel();
            }
        } else if (e.key === 'Escape') {
            onCancel();
        }
    }

    function handleBlur() {
        const trimmedValue = value.trim();
        if (trimmedValue) {
            onSubmit(trimmedValue);
        } else {
            onCancel();
        }
    }

    return (
        <div className="tree-node">
            <div className="tree-node-header">
                <div className="tree-node-content">
                    <div className="tree-node-icon">
                        {Icon && <Icon size={16} />}
                    </div>
                    <input
                        ref={inputRef}
                        type="text"
                        className="tree-node-input"
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        onBlur={handleBlur}
                        onKeyDown={handleKeyDown}
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            </div>
        </div>
    );
}

function Node({ node, moveNode, appendNode, removeNode, first, renameNode, openNode }) {
    const nodeRef = useRef(null);
    const [open, setOpen] = useState(node.is_open);
    const [isDragging, setIsDragging] = useState(false);
    const [closestEdgeOfTarget, setClosestEdgeOfTarget] = useState(null);
    const [aboutToDrop, setAboutToDrop] = useState(false);
    const [isContextMenuOpen, setIsContextMenuOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [showNewNodeInput, setShowNewNodeInput] = useState(false);
    const isEditingRef = useRef(false);
    const hasChildren = node.children && node.children.length > 0;
    const isFolder = node.is_folder;

    const { show: showContextMenu, hideAll: hideContextMenu } = useContextMenu({
        id: node.id,
    });

    function handleClick(event) {
        if (!isEditing) {
            handleCollapse(event);

            if (!isFolder) {
                openNode({ nodeId: node.id });
            }
        }
    }

    function handleCollapse() {
        if (aboutToDrop || isEditing) return;

        if (isFolder) {
            setOpen((v) => {
                const val = !v;

                node.is_open = val;

                return val;
            });
        }
    }

    function handleStartEditing() {
        setIsEditing(true);
    }

    function handleFinishEditing(newLabel) {
        renameNode({ nodeId: node.id, newLabel });
        setIsEditing(false);
    }

    function handleAddChild(event) {
        if(event){
            event.preventDefault();
            event.stopPropagation();
        }

        if (isFolder && !open) {
            setOpen(true);
        }
        setShowNewNodeInput(true);
    }

    function handleRemoveNode(nodeId) {
        removeNode({ nodeId });
    }

    function handleContextMenu(event) {
        event.preventDefault();
        event.stopPropagation();

        showContextMenu({
            event,
            props: {
                node,
            },
        });
    }

    function handleContextMenuVisibilityChange(isVisible) {
        setIsContextMenuOpen(isVisible);
    }

    function handleContextMenuItemClick(data) {
        const { node } = data.event.props;

        hideContextMenu();

        switch (data.type) {
            case 'add-page':
                handleAddChild();
                break;
            case 'open':
                openNode({ nodeId: node.id });
                break;
            case 'rename':
                handleStartEditing();
                break;
            case 'delete':
                handleRemoveNode(node.id);
                break;
            case 'copy':
                console.log('copy');
                break;
        }
    }

    function handleNewNodeSubmit(label) {
        appendNode({
            targetNodeId: node.id,
            node: {
                id: Date.now(),
                label,
                parent_id: node.id,
                is_folder: false,
            },
        });
        setShowNewNodeInput(false);
    }

    useEffect(() => {
        isEditingRef.current = isEditing;
    }, [isEditing]);

    // Drag and drop
    useEffect(() => {
        if (!nodeRef.current) return;

        const dragCleanup = draggable({
            element: nodeRef.current,
            getInitialData() {
                return node;
            },
            canDrag() {
                return !isEditingRef.current;
            },
            onDragStart() {
                setIsDragging(true);
            },
            onDrop() {
                setIsDragging(false);
            },
        });

        const dropCleanup = dropTargetForElements({
            element: nodeRef.current,
            getData: ({ input, element }) => {
                const data = node

                const edges = ['bottom'];

                if (first) {
                    edges.unshift('top');
                }

                return attachInstruction(data, {
                    input,
                    element,
                    mode: 'standard',
                });
            },
            canDrop({ source }) {
                return source.data.id !== node.id;
            },
            onDrag({ source, self, location }) {
                const value = extractInstruction(self.data);

                if (isFolder) {
                    setClosestEdgeOfTarget(null);

                    const dropTarget = location.current.dropTargets[0].data;
                    const isEmptyParentFolder = self.data.id === dropTarget.parent_id && !dropTarget.children?.length;
                    const isSameFolder = dropTarget.id === self.data.id;
                    const isDifferentParent = source.data.parent_id !== self.data.id;

                    if ((isEmptyParentFolder || isSameFolder) && isDifferentParent) {
                        setAboutToDrop(true);
                    } else {
                        setAboutToDrop(false);
                    }

                    if (!first) {
                        return;
                    }
                };

                setClosestEdgeOfTarget(value);
            },
            onDragLeave() {
                setClosestEdgeOfTarget(null);
                setAboutToDrop(false);
            },
            onDrop(options) {
                const { source, self, location } = options;
                const value = extractInstruction(self.data);

                setClosestEdgeOfTarget(null);
                setAboutToDrop(false);

                if (location.current.dropTargets[0].data.id === node.id && source.data.parent_id !== node.id) {
                    moveNode({
                        sourceId: source.data.id,
                        sourceParentId: source.data.parent_id,
                        targetId: self.data.id,
                        targetParentId: self.data.parent_id,
                        shouldAppend: self.data.is_folder && value.type == 'make-child',
                        edge: value.type == 'reorder-above' ? 'top' : 'bottom',
                    });
                }
            },
        });

        return () => {
            dragCleanup();
            dropCleanup();
        };
    }, [node]);

    return (
        <div className={['tree-node', isDragging && 'dragging', aboutToDrop && 'about-to-drop', isContextMenuOpen && 'active'].filter(Boolean).join(' ')} ref={nodeRef}>
            {isEditing ? (
                <NodeInput
                    initialValue={node.label}
                    icon={isFolder ? Folder : FileText}
                    onSubmit={handleFinishEditing}
                    onCancel={() => setIsEditing(false)}
                />
            ) : (
                <div className="tree-node-header" onClick={handleClick} onContextMenu={handleContextMenu}>
                    <div className="tree-node-content">
                        <div className="tree-node-icon">
                            {isFolder ? (
                                <>
                                    {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                    <Folder size={16} />
                                </>
                            ) : (<FileText size={16} />)}
                        </div>
                        <span className="tree-node-label">{node.label}</span>
                    </div>
                    <div className="tree-node-actions">
                        {isFolder && (
                            <button onClick={handleAddChild}>
                                <Plus size={16} />
                            </button>
                        )}
                        <button onClick={handleContextMenu}>
                            <MoreVertical size={16} />
                        </button>
                    </div>
                </div>
            )}

            {(hasChildren || showNewNodeInput) && open && (
                <div className="tree-node-children">
                    {node.children?.map((child, index) => (
                        <Node
                            key={index}
                            first={index === 0}
                            node={child}
                            moveNode={moveNode}
                            appendNode={appendNode}
                            removeNode={removeNode}
                            renameNode={renameNode}
                            openNode={openNode}
                        />
                    ))}

                    {showNewNodeInput && (
                        <NodeInput
                            onSubmit={handleNewNodeSubmit}
                            onCancel={() => setShowNewNodeInput(false)}
                        />
                    )}
                </div>
            )}

            {(closestEdgeOfTarget && closestEdgeOfTarget.type !== 'make-child') && <DropIndicator edge={closestEdgeOfTarget.type == 'reorder-above' ? 'top' : 'bottom'} />}

            <ContextMenu
                folder={isFolder}
                menuId={node.id}
                onItemClick={handleContextMenuItemClick}
                onVisibilityChange={handleContextMenuVisibilityChange}
            />
        </div>
    );
}

export default function TreeStructure({ 
    data: initialData, 
    onChange, 
    onMove, 
    onAppend, 
    onRemove, 
    onRename, 
    onOpen,
}) {
    const [data, setData] = useState(initialData);
    const dataRef = useRef(data);
    const isMounted = useRef(false);

    const openNode = useCallback(({ nodeId }) => {
        onOpen && onOpen({ nodeId });
    }, []);

    const moveNode = useCallback(({ sourceId, targetId, targetParentId, shouldAppend = false, edge }) => {
        onMove && onMove({ sourceId, targetId, targetParentId, shouldAppend, edge });

        const newData = [...dataRef.current];

        const sourceContext = recursiveFindNodeAndParent(newData, sourceId);
        const targetContext = recursiveFindNodeAndParent(newData, targetId);

        let sourceNode = sourceContext.node;
        let sourceParent = sourceContext.parent;
        let targetNode = targetContext.node;
        let targetParent = targetContext.parent;

        if (sourceParent) {
            sourceParent.children = sourceParent.children.filter(child => child.id !== sourceId);
        } else {
            const index = newData.findIndex(node => node.id === sourceId);
            newData.splice(index, 1);
        }

        if (targetParent) {
            sourceNode.parent_id = targetParent.id;
        } else {
            sourceNode.parent_id = 0;
        }

        if (shouldAppend) {
            targetNode.children.push(sourceNode);
        } else if (targetParentId) {
            if (edge === 'top') {
                const targetIndex = targetParent.children.findIndex(child => child.id === targetId);
                targetParent.children.splice(targetIndex, 0, sourceNode);
            } else if (edge === 'bottom') {
                const targetIndex = targetParent.children.findIndex(child => child.id === targetId);
                targetParent.children.splice(targetIndex + 1, 0, sourceNode);
            }
        } else {
            if (edge === 'top') {
                const targetIndex = newData.findIndex(node => node.id === targetId);
                newData.splice(targetIndex, 0, sourceNode);
            } else {
                const targetIndex = newData.findIndex(node => node.id === targetId);
                newData.splice(targetIndex + 1, 0, sourceNode);
            }
        }

        setData(newData);
    }, []);

    const appendNode = useCallback(({ targetNodeId, node }) => {
        onAppend && onAppend({ targetNodeId, node });

        const newData = [...dataRef.current];

        const { node: targetNode } = recursiveFindNodeAndParent(newData, targetNodeId);

        node.parent_id = targetNode ? targetNode.id : 0;

        if (targetNode) {
            targetNode.children.push(node);
        } else {
            newData.push(node);
        }

        setData(newData);
    }, []);

    const removeNode = useCallback(({ nodeId }) => {
        onRemove && onRemove({ nodeId });

        const newData = [...dataRef.current];

        const { node: targetNode, parent: targetParent } = recursiveFindNodeAndParent(newData, nodeId);

        if (targetParent) {
            const index = targetParent.children.findIndex(node => node.id === nodeId);
            targetParent.children.splice(index, 1);
        } else {
            const index = newData.findIndex(node => node.id === nodeId);
            newData.splice(index, 1);
        }

        setData(newData);
    }, []);

    const renameNode = useCallback(({ nodeId, newLabel }) => {
        onRename && onRename({ nodeId, newLabel });

        const newData = [...dataRef.current];
        const { node: targetNode } = recursiveFindNodeAndParent(newData, nodeId);

        if (targetNode) {
            targetNode.label = newLabel;
            setData(newData);
        }
    }, []);

    useEffect(() => {
        if (isMounted.current) {
            dataRef.current = data;

            onChange && onChange(data);
        }
    }, [data, onChange]);

    useEffect(() => {
        isMounted.current = true;
    }, []);

    return (
        <div>
            {data.map((node, index) => (
                <Node
                    key={index}
                    node={node}
                    openNode={openNode}
                    moveNode={moveNode}
                    appendNode={appendNode}
                    removeNode={removeNode}
                    renameNode={renameNode}
                    first={index === 0}
                />
            ))}
        </div>
    );
}