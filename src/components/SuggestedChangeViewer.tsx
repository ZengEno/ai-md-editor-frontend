import { Box, Text, VStack, useDisclosure } from "@chakra-ui/react";
import { diffLines, Change } from "diff";
import { useFileStore } from "../stores/fileStore";
import { useEditedArticleStore } from "../stores/editedArticleStore";

interface SuggestedChangeViewerProps {
    originalContent: string;
    editedContent: string;
    relatedFileName: string;
    isHidden?: boolean;
}

type CompactDiffPart = Change | { type: "skipped"; count: number };

export function SuggestedChangeViewer({
    originalContent,
    editedContent,
    relatedFileName,
    isHidden = false,
}: SuggestedChangeViewerProps) {
    const { files, handleFileSelect } = useFileStore();
    const { setEditedContent, setIsShowingEdit } = useEditedArticleStore();
    const { isOpen, onOpen, onClose } = useDisclosure();

    const relatedFile = files.find((f) => f.name === relatedFileName);

    const diff = diffLines(originalContent, editedContent);
    const compactDiff: CompactDiffPart[] = [];
    let skippedLines = 0;

    for (const part of diff) {
        if (part.added || part.removed) {
            if (skippedLines > 0) {
                compactDiff.push({ type: "skipped", count: skippedLines });
                skippedLines = 0;
            }
            compactDiff.push(part);
        } else {
            skippedLines += part.count || 0;
        }
    }
    if (skippedLines > 0) {
        compactDiff.push({ type: "skipped", count: skippedLines });
    }

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
            <Text fontWeight="medium" mb={2} fontSize="sm">
                Suggested changes for: {relatedFileName}
            </Text>
            {!isHidden && (
                <VStack align="stretch" spacing={1}>
                    {compactDiff.map((part, index) => {
                        if ("type" in part && part.type === "skipped") {
                            return (
                                <Text
                                    key={index}
                                    color="gray.500"
                                    fontSize="2xs"
                                    textAlign="center"
                                >
                                    — skipped {part.count} lines —
                                </Text>
                            );
                        }

                        if ("value" in part) {
                            return (
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
                            );
                        }
                        return null;
                    })}
                </VStack>
            )}
        </Box>
    );
}
