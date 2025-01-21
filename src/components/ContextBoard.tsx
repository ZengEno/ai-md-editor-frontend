import {
    Box,
    Text,
    VStack,
    Button,
    HStack,
    IconButton,
    Tooltip,
} from "@chakra-ui/react";
import { AddIcon, CloseIcon } from "@chakra-ui/icons";
import { ArticleReference } from "../types/chat";
import { ContextFileSelector } from "./ContextFileSelector";
import { useState } from "react";

interface ContextBoardProps {
    currentFile: ArticleReference | null;
    highlightedText: string;
    otherArticles: ArticleReference[];
    referenceArticles: ArticleReference[];
    onUpdateOtherArticles: (files: ArticleReference[]) => void;
    onUpdateReferenceArticles: (files: ArticleReference[]) => void;
}

export function ContextBoard({
    currentFile,
    highlightedText,
    otherArticles,
    referenceArticles,
    onUpdateOtherArticles,
    onUpdateReferenceArticles,
}: ContextBoardProps) {
    const [isFileSelectorOpen, setIsFileSelectorOpen] = useState(false);

    const handleSelectFiles = (selectedFiles: ArticleReference[]) => {
        // Split selected files by category
        const other = selectedFiles.filter(
            (f) => f.file_category === "editable"
        );
        const reference = selectedFiles.filter(
            (f) => f.file_category === "reference"
        );
        onUpdateOtherArticles(other);
        onUpdateReferenceArticles(reference);
    };

    const abbreviateText = (text: string, maxLength: number = 30) => {
        if (text.length <= maxLength) return text;
        const start = text.slice(0, maxLength / 2 - 2);
        const end = text.slice(-maxLength / 2 + 1);
        return `${start}...${end}`;
    };

    const removeOtherArticle = (id: string) => {
        onUpdateOtherArticles(
            otherArticles.filter((article) => article.id !== id)
        );
    };

    const removeReferenceArticle = (id: string) => {
        onUpdateReferenceArticles(
            referenceArticles.filter((article) => article.id !== id)
        );
    };

    return (
        <Box
            p={2}
            bg="gray.50"
            borderRadius="md"
            fontSize="sm"
            color="gray.600"
        >
            <VStack align="flex-start" spacing={2} maxH="240px">
                <Box w="100%" position="sticky" top={0} bg="gray.50" zIndex={1}>
                    <HStack justify="space-between" w="100%">
                        <Text fontWeight="medium">Context</Text>
                        <Tooltip
                            label="Add or remove context files"
                            aria-label="A tooltip"
                        >
                            <IconButton
                                aria-label="Add context files"
                                icon={<AddIcon />}
                                size="xs"
                                mr={2}
                                onClick={() => setIsFileSelectorOpen(true)}
                            />
                        </Tooltip>
                    </HStack>
                </Box>

                <Box w="100%" overflowY="auto" pr={2}>
                    <VStack align="flex-start" spacing={2}>
                        {currentFile && (
                            <Text>
                                <Text as="span" fontWeight="medium">
                                    current file:
                                </Text>{" "}
                                <Tooltip label={currentFile.file_name}>
                                    <Text as="span">
                                        {abbreviateText(currentFile.file_name)}
                                    </Text>
                                </Tooltip>
                            </Text>
                        )}

                        {highlightedText && (
                            <Text>
                                <Text as="span" fontWeight="medium">
                                    highlight:
                                </Text>{" "}
                                {abbreviateText(highlightedText)}
                            </Text>
                        )}

                        {otherArticles.length > 0 && (
                            <VStack align="flex-start" w="100%" spacing={1}>
                                <Text fontWeight="medium">Workspace Articles:</Text>
                                {otherArticles.map((article) => (
                                    <HStack key={article.id} w="100%">
                                        <Tooltip label={article.file_name}>
                                            <Text flex={1} isTruncated>
                                                {abbreviateText(
                                                    article.file_name
                                                )}
                                            </Text>
                                        </Tooltip>
                                        <IconButton
                                            aria-label="Remove article"
                                            icon={<CloseIcon />}
                                            size="xs"
                                            onClick={() =>
                                                removeOtherArticle(article.id)
                                            }
                                        />
                                    </HStack>
                                ))}
                            </VStack>
                        )}

                        {referenceArticles.length > 0 && (
                            <VStack align="flex-start" w="100%" spacing={1}>
                                <Text fontWeight="medium">
                                    Reference Articles:
                                </Text>
                                {referenceArticles.map((article) => (
                                    <HStack key={article.id} w="100%">
                                        <Tooltip label={article.file_name}>
                                            <Text flex={1} isTruncated>
                                                {abbreviateText(
                                                    article.file_name
                                                )}
                                            </Text>
                                        </Tooltip>
                                        <IconButton
                                            aria-label="Remove article"
                                            icon={<CloseIcon />}
                                            size="xs"
                                            onClick={() =>
                                                removeReferenceArticle(
                                                    article.id
                                                )
                                            }
                                        />
                                    </HStack>
                                ))}
                            </VStack>
                        )}
                    </VStack>
                </Box>
            </VStack>

            <ContextFileSelector
                isOpen={isFileSelectorOpen}
                onClose={() => setIsFileSelectorOpen(false)}
                onSelect={handleSelectFiles}
                currentSelectedFiles={[...otherArticles, ...referenceArticles]}
                currentFileId={currentFile?.id || null}
                currentFile={currentFile}
            />
        </Box>
    );
}
