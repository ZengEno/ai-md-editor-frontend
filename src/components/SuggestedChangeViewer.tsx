import { Box, Text, VStack, useDisclosure, Button } from "@chakra-ui/react";
import { diffLines, Change } from "diff";
import { useFileStore } from "../stores/fileStore";
import { useEditedArticleStore } from "../stores/editedArticleStore";
import { useState, useRef, useEffect } from "react";
import { ChevronDownIcon, ChevronUpIcon } from "@chakra-ui/icons";

interface SuggestedChangeViewerProps {
    originalContent: string;
    editedContent: string;
    relatedFileName: string;
    isHidden?: boolean;
}

export function SuggestedChangeViewer({
    originalContent,
    editedContent,
    relatedFileName,
    isHidden = false,
}: SuggestedChangeViewerProps) {
    const { files, handleFileSelect } = useFileStore();
    const { setEditedContent, setIsShowingEdit } = useEditedArticleStore();
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [isExpanded, setIsExpanded] = useState(false);
    const [needsExpansion, setNeedsExpansion] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);
    const maxCollapsedHeight = 200; // Using number for comparison

    const relatedFile = files.find((f) => f.name === relatedFileName);
    const diff = diffLines(originalContent, editedContent);
    const changedParts = diff.filter((part) => part.added || part.removed);

    useEffect(() => {
        if (contentRef.current) {
            setNeedsExpansion(
                contentRef.current.scrollHeight > maxCollapsedHeight
            );
        }
    }, [changedParts]);

    const handleClick = async () => {
        if (relatedFile) {
            const fileData = await relatedFile.handle.getFile();
            const content = await fileData.text();
            handleFileSelect(content, relatedFile);
            setEditedContent(editedContent);
            setIsShowingEdit(true);
        }
    };

    return (
        <Box
            mt={2}
            p={3}
            borderWidth="1px"
            borderRadius="md"
            bg="gray.50"
            cursor="pointer"
            _hover={{ bg: "gray.100" }}
            onClick={handleClick}
        >
            <Text fontWeight="medium" mb={2} fontSize="xs">
                Suggested changes for: {relatedFileName}
            </Text>
            {!isHidden && (
                <>
                    <Box
                        ref={contentRef}
                        maxH={isExpanded ? "none" : `${maxCollapsedHeight}px`}
                        overflowY="auto"
                        transition="max-height 0.2s ease-in-out"
                        mb={needsExpansion ? 2 : 0}
                        css={{
                            "&::-webkit-scrollbar": {
                                width: "4px",
                            },
                            "&::-webkit-scrollbar-track": {
                                width: "6px",
                            },
                            "&::-webkit-scrollbar-thumb": {
                                background: "gray.200",
                                borderRadius: "24px",
                            },
                        }}
                    >
                        <VStack align="stretch" spacing={1}>
                            {changedParts.map((part, index) => (
                                <Box
                                    key={index}
                                    bg={
                                        part.added
                                            ? "green.50"
                                            : part.removed
                                            ? "red.50"
                                            : "transparent"
                                    }
                                    color={
                                        part.added
                                            ? "green.800"
                                            : part.removed
                                            ? "red.800"
                                            : "inherit"
                                    }
                                    p={1}
                                    borderRadius="sm"
                                    fontSize="2xs"
                                    fontFamily="monospace"
                                >
                                    {part.value.split("\n").map(
                                        (line, i) =>
                                            line && (
                                                <Text key={i}>
                                                    {part.added
                                                        ? "+ "
                                                        : part.removed
                                                        ? "- "
                                                        : "  "}
                                                    {line}
                                                </Text>
                                            )
                                    )}
                                </Box>
                            ))}
                        </VStack>
                    </Box>
                    {needsExpansion && (
                        <Button
                            variant="ghost"
                            size="xs"
                            width="100%"
                            height="20px"
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsExpanded(!isExpanded);
                            }}
                            rightIcon={
                                isExpanded ? (
                                    <ChevronUpIcon />
                                ) : (
                                    <ChevronDownIcon />
                                )
                            }
                            _hover={{ bg: "gray.100" }}
                        >
                            {isExpanded ? "Show less" : "Show more"}
                        </Button>
                    )}
                </>
            )}
        </Box>
    );
}
