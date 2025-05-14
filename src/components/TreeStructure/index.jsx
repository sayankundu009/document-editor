import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronRight, FileText, Folder, MoreVertical, Plus } from "lucide-react";

import { draggable } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';

import {
    attachInstruction,
    extractInstruction,
} from '@atlaskit/pragmatic-drag-and-drop-hitbox/tree-item';

import { DropIndicator } from '@atlaskit/pragmatic-drag-and-drop-react-drop-indicator/box';

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

function Node({ node, moveNode, appendNode, first }) {
    const nodeRef = useRef(null);
    const [open, setOpen] = useState(node.is_open);
    const [isDragging, setIsDragging] = useState(false);
    const [closestEdgeOfTarget, setClosestEdgeOfTarget] = useState(null);
    const [aboutToDrop, setAboutToDrop] = useState(false);

    const hasChildren = node.children && node.children.length > 0;
    const isFolder = node.is_folder;

    function handleCollapse() {
        if (aboutToDrop) return;

        if (isFolder) {
            setOpen((v) => !v);
        }
    }

    function handleAddChild(event) {
        event.preventDefault();
        event.stopPropagation();

        appendNode({
            targetNodeId: node.id,
            node: {
                id: Date.now(),
                label: 'Untitled',
                parent_id: node.id,
            },
        });
    }

    useEffect(() => {
        if (!nodeRef.current) return;

        const dragCleanup = draggable({
            element: nodeRef.current,
            getInitialData() {
                return node;
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
        <div className={`tree-node ${isDragging ? 'dragging' : ''} ${aboutToDrop ? 'about-to-drop' : ''}`} ref={nodeRef}>
            <div className="tree-node-header" onClick={handleCollapse}>
                <div className="tree-node-content">
                    <div className="tree-node-icon">
                        {isFolder ? (
                            <>
                                {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}

                                <Folder size={16} />
                            </>
                        ) : (<FileText size={16} />)}
                    </div>
                    <span className="tree-node-label">{node.label} {first ? 'first' : ''}</span>
                </div>
                <div className="tree-node-actions">
                    {isFolder && (
                        <button onClick={handleAddChild}>
                            <Plus size={16} />
                        </button>
                    )}

                    <button>
                        <MoreVertical size={16} />
                    </button>
                </div>
            </div>

            {hasChildren && open && (
                <div className="tree-node-children">
                    {node.children.map((child, index) => (
                        <Node key={index} first={index == 0} node={child} moveNode={moveNode} appendNode={appendNode} />
                    ))}
                </div>
            )}

            {(closestEdgeOfTarget && closestEdgeOfTarget.type !== 'make-child') && <DropIndicator edge={closestEdgeOfTarget.type == 'reorder-above' ? 'top' : 'bottom'} />}
        </div>
    );
}

export default function TreeStructure({ data: initialData, onChange }) {
    const [data, setData] = useState(initialData);

    const dataRef = useRef(data);

    const moveNode = useCallback(({ sourceId, targetId, targetParentId, shouldAppend = false, edge }) => {
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

    useEffect(() => {
        dataRef.current = data;
    }, [data]);

    return (
        <div>
            {data.map((node, index) => (
                <Node key={index} node={node} moveNode={moveNode} appendNode={appendNode} />
            ))}
        </div>
    );
}