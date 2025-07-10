import { useEffect, useRef } from "react";
import "./style.css";
import Moveable from "moveable";

export default function ImagePanel({ editor }) {
    const moveableRef = useRef(null);
    const containerRef = useRef(null);
    const imageRef = useRef(null);

    function update() {
        const selection = editor.state.selection;
        const imgNode = selection.node;

        if(moveableRef.current) moveableRef.current.updateRect();

        if (imgNode?.type.name === 'image') {
            const dom = editor.view.nodeDOM(selection.from);

            if (dom instanceof HTMLImageElement) {
                imageRef.current = dom;

                if (moveableRef.current) {
                    moveableRef.current.target = dom;
                }
            }
        } else {
            imageRef.current = null;

            if (moveableRef.current) {
                moveableRef.current.target = null;
            }
        }
    }

    useEffect(() => {
        const editorContainer = editor.view.dom;

        containerRef.current = editorContainer;

        if (!moveableRef.current && containerRef.current) {
            moveableRef.current = new Moveable(document.body, {
                className: "moveable-image",
                throttleResize: 0,
                target: null,
                keepRatio: true,
                useMutationObserver: true,
                useResizeObserver: true,
                resizable: {
                    edge: ["e", "w"],
                    renderDirections: ["e", "w"],
                },
                padding: {
                    left: 10,
                    right: 10,
                }
            }).on("resize", ({ target, width, height }) => {
                const minWidth = 50;
                const minHeight = 50;
                const newWidth = Math.max(width, minWidth);
                const newHeight = Math.max(height, minHeight);
                
                target.style.width = `${newWidth}px`;
                target.style.height = `${newHeight}px`;
            }).on("resizeEnd", ({ target }) => {
                let width = parseFloat(target.style.width);
                let height = parseFloat(target.style.height);
                width = Math.max(width, 50);
                height = Math.max(height, 50);

                target.style.width = `${width}px`;
                target.style.height = `${height}px`;

                editor.chain().focus().setImageStyle({ width: `${width}px`, height: `${height}px` }).run();

                update();
            });
        }
    }, [editor]);

    useEffect(() => {
        if (!editor) return;

        editor.on("transaction", update);

        let resizeObserver = null;

        if (typeof window !== "undefined" && document && document.body) {
            resizeObserver = new ResizeObserver(() => {
                update();
            });
            resizeObserver.observe(document.body);
        }

        return () => {
            editor.off("transaction", update);

            if (resizeObserver) {
                resizeObserver.unobserve(document.body);
                resizeObserver.disconnect();
            }
        };
    }, [editor]);

    return <></>;
}