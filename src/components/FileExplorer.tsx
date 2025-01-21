import {
    VStack,
    Button,
    Text,
    Box,
    IconButton,
    Menu,
    MenuButton,
    MenuList,
    MenuItem,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalCloseButton,
    ModalBody,
    ModalFooter,
    FormControl,
    FormLabel,
    Input,
    Flex,
} from "@chakra-ui/react";
import { HamburgerIcon, DeleteIcon, EditIcon } from "@chakra-ui/icons";
import { useState } from "react";
import CreateFileModal from "./CreateFileModal";
import { useFileExplorer } from "../hooks/useFileExplorer";
import type { FileItem } from "../types/file";
import { FileNameValidator } from "../utils/fileValidation";

const FileExplorer = () => {
    const {
        files,
        selectedFileId,
        directoryHandle,
        unsavedFileIds,
        handleFolderSelect,
        handleFileClick,
        handleDelete,
        getGroupedFiles,
        handleCreateFile,
        handleRenameFile,
    } = useFileExplorer();

    const [isCreateModalOpen, setCreateModalOpen] = useState(false);
    const [fileToRename, setFileToRename] = useState<FileItem | null>(null);
    const [newFileName, setNewFileName] = useState("");
    const [isRenameModalOpen, setRenameModalOpen] = useState(false);
    const [renameError, setRenameError] = useState<string>("");
    const groupedFiles = getGroupedFiles();

    const validateFileName = (name: string, currentFile: FileItem | null) => {
        const result = FileNameValidator.validate(name, {
            currentFileId: currentFile?.id,
            existingFiles: files.map((f) => f.name),
        });
        return result.error;
    };

    return (
        <Flex direction="column" h="100%">

            {/* Scrollable area */}
            <Flex direction="column" flex={1} minH={0} position="relative">
                <Box 
                    flex={1} 
                    overflowY="auto" 
                    p={2}
                >
                    {/* Editable Files Section */}
                    {groupedFiles.editableFiles.length > 0 && (
                        <>
                            <Text
                                fontSize="sm"
                                fontWeight="bold"
                                color="gray.600"
                                mb={2}
                            >
                                Workspace Files
                            </Text>
                            {groupedFiles.editableFiles.map((file) => (
                                <FileListItem
                                    key={file.id}
                                    file={file}
                                    isSelected={selectedFileId === file.id}
                                    isUnsaved={unsavedFileIds.has(file.id)}
                                    onFileClick={handleFileClick}
                                    onDelete={handleDelete}
                                    onRename={(file) => {
                                        setFileToRename(file);
                                        setNewFileName(file.name);
                                        setRenameModalOpen(true);
                                    }}
                                />
                            ))}
                        </>
                    )}

                    {/* Read-only Files Section */}
                    {groupedFiles.readOnlyFiles.length > 0 && (
                        <>
                            <Text
                                fontSize="sm"
                                fontWeight="bold"
                                color="gray.600"
                                mt={4}
                                mb={2}
                            >
                                Reference Files
                            </Text>
                            {groupedFiles.readOnlyFiles.map((file) => (
                                <FileListItem
                                    key={file.id}
                                    file={file}
                                    isSelected={selectedFileId === file.id}
                                    onFileClick={handleFileClick}
                                    isReadOnly
                                />
                            ))}
                        </>
                    )}
                </Box>
            </Flex>

            {/* Footer - fixed size */}
            <Box
                p={4}
                borderTop="1px"
                borderColor="gray.200"
                bg="gray.50"
                flexShrink={0}
                mt="auto"
            >
                <VStack spacing={2} width="100%">
                    <Button
                        colorScheme="green"
                        onClick={() => setCreateModalOpen(true)}
                        size="sm"
                        width="100%"
                        isDisabled={!directoryHandle}
                    >
                        Create Markdown
                    </Button>
                    <Button
                        colorScheme="blue"
                        onClick={handleFolderSelect}
                        size="sm"
                        width="100%"
                    >
                        Load Workspace Folder
                    </Button>
                </VStack>
            </Box>

            {/* Create File Modal */}
            <CreateFileModal
                isOpen={isCreateModalOpen}
                onClose={() => setCreateModalOpen(false)}
                onCreateFile={handleCreateFile}
                existingFiles={files.map((f) => f.name)}
            />

            <Modal
                isOpen={isRenameModalOpen}
                onClose={() => {
                    setRenameModalOpen(false);
                    setRenameError("");
                }}
            >
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Rename File</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <FormControl isInvalid={!!renameError}>
                            <FormLabel>New File Name</FormLabel>
                            <Input
                                value={newFileName.replace(/\.md$/, "")}
                                onChange={(e) => {
                                    const newName = e.target.value;
                                    setNewFileName(newName);
                                    setRenameError(
                                        validateFileName(newName, fileToRename)
                                    );
                                }}
                                placeholder="Enter new file name"
                            />
                            {renameError && (
                                <Text color="red.500" fontSize="sm" mt={1}>
                                    {renameError}
                                </Text>
                            )}
                        </FormControl>
                    </ModalBody>
                    <ModalFooter>
                        <Button
                            variant="ghost"
                            mr={3}
                            onClick={() => {
                                setRenameModalOpen(false);
                                setRenameError("");
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            colorScheme="blue"
                            onClick={async () => {
                                const finalName = newFileName.endsWith(".md")
                                    ? newFileName
                                    : `${newFileName}.md`;

                                if (
                                    fileToRename &&
                                    (await handleRenameFile(
                                        fileToRename,
                                        finalName
                                    ))
                                ) {
                                    setRenameModalOpen(false);
                                    setFileToRename(null);
                                    setNewFileName("");
                                    setRenameError("");
                                }
                            }}
                            isDisabled={!!renameError || !newFileName.trim()}
                        >
                            Rename
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </Flex>
    );
};

interface FileListItemProps {
    file: FileItem;
    isSelected: boolean;
    isUnsaved?: boolean;
    isReadOnly?: boolean;
    onFileClick: (file: FileItem, e: React.MouseEvent) => void;
    onDelete?: (file: FileItem) => void;
    onRename?: (file: FileItem) => void;
}

const FileListItem = ({
    file,
    isSelected,
    isUnsaved,
    isReadOnly,
    onFileClick,
    onDelete,
    onRename,
}: FileListItemProps) => (
    <Box
        p={2}
        cursor="pointer"
        display="flex"
        alignItems="center"
        gap={2}
        onClick={(e) => onFileClick(file, e)}
        bg={isSelected ? (isReadOnly ? "gray.100" : "blue.50") : "transparent"}
        _hover={{
            bg: isSelected ? (isReadOnly ? "gray.200" : "blue.100") : "gray.50",
        }}
        borderRadius="md"
        transition="all 0.2s"
        opacity={isReadOnly ? 0.8 : 1}
    >
        {isUnsaved && (
            <Text color="orange.500" fontSize="xl" lineHeight="1" mb="1px">
                •
            </Text>
        )}
        <Text flex="1" isTruncated color={isReadOnly ? "gray.600" : "inherit"}>
            {isReadOnly ? file.path.replace("references/", "📚 ") : file.path}
        </Text>
        {!isReadOnly && onDelete && (
            <Box className="file-menu" onClick={(e) => e.stopPropagation()}>
                <Menu>
                    <MenuButton
                        as={IconButton}
                        icon={<HamburgerIcon />}
                        variant="ghost"
                        size="sm"
                        aria-label="File options"
                    />
                    <MenuList>
                        <MenuItem
                            icon={<EditIcon />}
                            onClick={() => onRename?.(file)}
                        >
                            Rename
                        </MenuItem>
                        <MenuItem
                            icon={<DeleteIcon />}
                            onClick={() => onDelete?.(file)}
                            color="red.500"
                        >
                            Delete
                        </MenuItem>
                    </MenuList>
                </Menu>
            </Box>
        )}
    </Box>
);

export default FileExplorer;
