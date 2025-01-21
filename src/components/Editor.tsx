import {
    Box,
    Flex,
    Button,
    Text,
    Icon,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
} from "@chakra-ui/react";
import {
    CheckIcon,
    ViewIcon,
    ViewOffIcon,
    LockIcon,
    TimeIcon,
} from "@chakra-ui/icons";
import MonacoEditor, { OnChange, OnMount } from "@monaco-editor/react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import remarkGfm from "remark-gfm";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css"; // Import KaTeX CSS
import { useState, useRef, useEffect } from "react";
import { useFileStore } from "../stores/fileStore";
import { VersionModal } from "./VersionModal";
import DiffViewer from "./DiffViewer";
import { useVersionStore } from "../stores/versionStore";
import { useEditor } from "../hooks/useEditor";
import { useEditedArticleStore } from "../stores/editedArticleStore";

interface EditorProps {
    content: string;
    onChange: (value: string) => void;
    currentFile: {
        name: string;
        handle: FileSystemFileHandle;
        id: string;
        path: string;
        isReadOnly?: boolean;
    } | null;
    onSave: () => void;
}

const Editor = ({ content, onChange, currentFile, onSave }: EditorProps) => {
    const {
        showPreview,
        setShowPreview,
        imageUrls,
        imagesLoading,
        editorRef,
        comparison,
        workspaceHandle,
        setModalOpen,
        setComparison,
        handleEditorChange,
        handlePreviewSelect,
        handleAcceptChanges,
    } = useEditor(content, onChange, currentFile, onSave);

    const { setEditorRef } = useFileStore();

    const onEditorMount = (editor: any) => {
        const ref = { current: editor };
        setEditorRef(ref);
    };

    const { editedContent, isShowingEdit, setIsShowingEdit, clearEdit } = useEditedArticleStore();

    return (
        <Flex direction="column" h="100%">
            {/* Toolbar */}
            <Flex
                p={4}
                borderBottom="1px"
                borderColor="gray.200"
                bg="gray.50"
                justify="space-between"
                align="center"
            >
                <Flex align="center" gap={2}>
                    <Text fontSize="md" fontWeight="medium">
                        {currentFile?.name}
                    </Text>
                    {currentFile?.isReadOnly && (
                        <Text
                            fontSize="xs"
                            color="gray.500"
                            bg="gray.200"
                            px={2}
                            py={1}
                            borderRadius="md"
                            display="flex"
                            alignItems="center"
                            gap={1}
                        >
                            <Icon as={LockIcon} />
                            Reference File
                        </Text>
                    )}
                </Flex>
                <Flex gap={2}>
                    <Button
                        leftIcon={showPreview ? <ViewIcon /> : <ViewOffIcon />}
                        size="sm"
                        onClick={() => setShowPreview(!showPreview)}
                    >
                        Preview
                    </Button>
                    {!currentFile?.isReadOnly && (
                        <Button
                            leftIcon={<TimeIcon />}
                            size="sm"
                            onClick={() => setModalOpen(true)}
                        >
                            Versions
                        </Button>
                    )}
                    {!currentFile?.isReadOnly && (
                        <Button
                            leftIcon={<CheckIcon />}
                            colorScheme="blue"
                            size="sm"
                            onClick={onSave}
                        >
                            Save
                        </Button>
                    )}
                </Flex>
            </Flex>

            {/* Editor and Preview */}
            <Flex flex="1" overflow="hidden">
                {/* Editor Panel */}
                <Box flex={showPreview ? 1 : 2} h="100%" minW="50%">
                    <MonacoEditor
                        height="100%"
                        defaultLanguage="markdown"
                        value={content}
                        onChange={handleEditorChange}
                        onMount={onEditorMount}
                        options={{
                            minimap: { enabled: false },
                            wordWrap: "on",
                            readOnly: currentFile?.isReadOnly,
                            domReadOnly: currentFile?.isReadOnly,
                            fontSize: 14,
                        }}
                    />
                </Box>

                {/* Preview/Diff Panel */}
                {showPreview && (
                    <Box
                        flex={1}
                        minW="50%"
                        maxH="100%"
                        overflowY="auto"
                        borderLeft="1px"
                        borderColor="gray.200"
                    >
                        {comparison ? (
                            <Box
                                display="flex"
                                flexDirection="column"
                                height="100%"
                            >
                                <Flex
                                    p={2}
                                    bg="blue.50"
                                    borderBottom="1px"
                                    borderColor="blue.200"
                                    justify="space-between"
                                    align="center"
                                    position="sticky"
                                    top={0}
                                    zIndex={1}
                                >
                                    <Text fontSize="sm" color="blue.700">
                                        Comparing with version:{" "}
                                        {comparison.version.name}
                                    </Text>
                                    <Flex gap={2}>
                                        <Button
                                            size="sm"
                                            colorScheme="green"
                                            onClick={handleAcceptChanges}
                                        >
                                            Accept Changes
                                        </Button>
                                        <Button
                                            size="sm"
                                            onClick={() => setComparison(null)}
                                        >
                                            Close Comparison
                                        </Button>
                                    </Flex>
                                </Flex>
                                <Box flex="1" overflowY="auto" p={4}>
                                    <DiffViewer
                                        oldContent={content}
                                        newContent={comparison.content}
                                    />
                                </Box>
                            </Box>
                        ) : editedContent && isShowingEdit ? (
                            <Box display="flex" flexDirection="column" height="100%">
                                <Flex
                                    p={2}
                                    bg="blue.50"
                                    borderBottom="1px"
                                    borderColor="blue.200"
                                    justify="space-between"
                                    align="center"
                                    position="sticky"
                                    top={0}
                                    zIndex={1}
                                >
                                    <Text fontSize="sm" color="blue.700">
                                        AI Suggested Changes
                                    </Text>
                                    <Flex gap={2}>
                                        <Button
                                            size="sm"
                                            colorScheme="green"
                                            onClick={() => {
                                                onChange(editedContent);
                                                clearEdit();
                                            }}
                                        >
                                            Accept Changes
                                        </Button>
                                        <Button
                                            size="sm"
                                            onClick={() => clearEdit()}
                                        >
                                            Close
                                        </Button>
                                    </Flex>
                                </Flex>
                                <Box flex="1" overflowY="auto" p={4}>
                                    <DiffViewer
                                        oldContent={content}
                                        newContent={editedContent}
                                    />
                                </Box>
                            </Box>
                        ) : (
                            <Box onMouseUp={handlePreviewSelect} p={4}>
                                <ReactMarkdown
                                    remarkPlugins={[remarkMath, remarkGfm]}
                                    rehypePlugins={[rehypeKatex]}
                                    components={{
                                        img: ({ src, ...props }) => {
                                            const imageUrl =
                                                src && imageUrls[src];
                                            if (imagesLoading) {
                                                return (
                                                    <span
                                                        style={{
                                                            display: "block",
                                                            width: "100%",
                                                            height: "200px",
                                                            backgroundColor:
                                                                "#EDF2F7",
                                                            textAlign: "center",
                                                            lineHeight: "200px",
                                                            color: "#718096",
                                                        }}
                                                    >
                                                        Loading image...
                                                    </span>
                                                );
                                            }
                                            return (
                                                <img
                                                    src={imageUrl}
                                                    {...props}
                                                    style={{ maxWidth: "100%" }}
                                                />
                                            );
                                        },
                                        h1: ({ children }) => (
                                            <Text
                                                as="h1"
                                                fontSize="2xl"
                                                fontWeight="bold"
                                                mt={6}
                                                mb={4}
                                            >
                                                {children}
                                            </Text>
                                        ),
                                        h2: ({ children }) => (
                                            <Text
                                                as="h2"
                                                fontSize="xl"
                                                fontWeight="bold"
                                                mt={5}
                                                mb={3}
                                            >
                                                {children}
                                            </Text>
                                        ),
                                        h3: ({ children }) => (
                                            <Text
                                                as="h3"
                                                fontSize="lg"
                                                fontWeight="bold"
                                                mt={4}
                                                mb={2}
                                            >
                                                {children}
                                            </Text>
                                        ),
                                        h4: ({ children }) => (
                                            <Text
                                                as="h4"
                                                fontSize="md"
                                                fontWeight="bold"
                                                mt={3}
                                                mb={2}
                                            >
                                                {children}
                                            </Text>
                                        ),
                                        p: ({ children, ...props }) => (
                                            <p
                                                {...props}
                                                style={{ margin: "1em 0" }}
                                            >
                                                {children}
                                            </p>
                                        ),
                                        table: ({ children }) => (
                                            <Box overflowX="auto" my={4}>
                                                <Table
                                                    variant="simple"
                                                    size="sm"
                                                    borderWidth="1px"
                                                >
                                                    {children}
                                                </Table>
                                            </Box>
                                        ),
                                        thead: ({ children }) => (
                                            <Thead bg="gray.50">
                                                {children}
                                            </Thead>
                                        ),
                                        tbody: ({ children }) => (
                                            <Tbody>{children}</Tbody>
                                        ),
                                        tr: ({ children }) => (
                                            <Tr borderBottomWidth="1px">
                                                {children}
                                            </Tr>
                                        ),
                                        th: ({ children }) => (
                                            <Th
                                                py={2}
                                                px={4}
                                                borderColor="gray.200"
                                                textAlign="left"
                                            >
                                                {children}
                                            </Th>
                                        ),
                                        td: ({ children }) => (
                                            <Td
                                                py={2}
                                                px={4}
                                                borderColor="gray.200"
                                            >
                                                {children}
                                            </Td>
                                        ),
                                    }}
                                >
                                    {content}
                                </ReactMarkdown>
                            </Box>
                        )}
                    </Box>
                )}
            </Flex>

            <VersionModal
                currentFile={currentFile}
                workspaceHandle={workspaceHandle}
                currentContent={content}
                onContentChange={onChange}
            />
        </Flex>
    );
};

export default Editor;
