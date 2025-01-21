import { Box } from "@chakra-ui/react";
import { useState, useCallback, MouseEvent, useEffect } from "react";

interface ResizablePanelProps {
    children: React.ReactNode;
    minWidth?: number;
    maxWidth?: number;
    defaultWidth: number;
    isResizable: "left" | "right" | "none";
}

const ResizablePanel = ({
    children,
    minWidth = 100,
    maxWidth = 800,
    defaultWidth,
    isResizable,
}: ResizablePanelProps) => {
    const [width, setWidth] = useState(defaultWidth);
    const [isResizing, setIsResizing] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            if (width > maxWidth) {
                setWidth(maxWidth);
            } else if (width < minWidth) {
                setWidth(minWidth);
            }
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [width, maxWidth, minWidth]);

    const startResizing = useCallback(
        (e: MouseEvent) => {
            e.preventDefault();
            setIsResizing(true);

            const startX = e.pageX;
            const startWidth = width;

            const handleMouseMove = (e: globalThis.MouseEvent) => {
                let newWidth;
                if (isResizable === "right") {
                    newWidth = startWidth + (e.pageX - startX);
                } else {
                    newWidth = startWidth - (e.pageX - startX);
                }

                const clampedWidth = Math.min(
                    Math.max(newWidth, minWidth),
                    maxWidth
                );
                setWidth(clampedWidth);
            };

            const handleMouseUp = () => {
                setIsResizing(false);
                document.removeEventListener("mousemove", handleMouseMove);
                document.removeEventListener("mouseup", handleMouseUp);
            };

            document.addEventListener("mousemove", handleMouseMove);
            document.addEventListener("mouseup", handleMouseUp);
        },
        [width, minWidth, maxWidth, isResizable]
    );

    return (
        <Box position="relative" width={`${width}px`} h="100%" flexShrink={0}>
            {children}
            {isResizable !== "none" && (
                <Box
                    position="absolute"
                    top={0}
                    {...(isResizable === "right" ? { right: 0 } : { left: 0 })}
                    width="6px"
                    height="100%"
                    cursor="col-resize"
                    onMouseDown={startResizing}
                    zIndex={2}
                    sx={{
                        background: "transparent",
                        "&::after": {
                            content: '""',
                            position: "absolute",
                            top: 0,
                            bottom: 0,
                            width: "1px",
                            backgroundColor: "gray.200",
                            left: isResizable === "right" ? "5px" : "0px",
                        },
                        "&:hover": {
                            background: "blue.100",
                            "&::after": {
                                backgroundColor: "blue.400",
                            },
                        },
                        "&:active": {
                            background: "blue.200",
                            "&::after": {
                                backgroundColor: "blue.500",
                            },
                        },
                    }}
                />
            )}
        </Box>
    );
};

export default ResizablePanel;
