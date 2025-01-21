import { Box, Text } from "@chakra-ui/react";
import { diffWords, Change } from "diff";

interface DiffViewerProps {
    oldContent: string;
    newContent: string;
}

const DiffViewer = ({ oldContent, newContent }: DiffViewerProps) => {
    const diff = diffWords(oldContent, newContent);

    return (
        <Box 
            fontFamily="monospace" 
            whiteSpace="pre-wrap" 
            borderWidth={1} 
            borderRadius="md"
            bg="gray.50"
        >
            {diff.map((part: Change, index: number) => (
                <Text
                    key={index}
                    as="span"
                    bg={part.added ? "green.100" : part.removed ? "red.100" : "transparent"}
                    color={part.added ? "green.800" : part.removed ? "red.800" : "inherit"}
                    textDecoration={part.removed ? "line-through" : "none"}
                >
                    {part.value}
                </Text>
            ))}
        </Box>
    );
};

export default DiffViewer;
