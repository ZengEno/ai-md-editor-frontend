import {
    BrowserRouter,
    Routes,
    Route,
    Navigate,
    useNavigate,
} from "react-router-dom";
import { Box, Flex, Text, Button } from "@chakra-ui/react";
import FileExplorer from "./components/FileExplorer";
import Editor from "./components/Editor";
import { AIChatPanel } from "./components/AIChatPanel";
import ResizablePanel from "./components/ResizablePanel";
import { useFileStore } from "./stores/fileStore";
import { ProtectedLayout } from "./components/ProtectedLayout";
import { AuthPage } from "./pages/AuthPage";
import { UserDashboard } from "./components/UserDashboard";
import { UserMenu } from "./components/UserMenu";
import { useEffect } from "react";
import { APIClient } from "./services/APIClient";
import { useAuthStore } from "./stores/authStore";
import { SessionExpiredModal } from "./components/SessionExpiredModal";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { useFileExplorer } from "./hooks/useFileExplorer";

function EditorLayout() {
    const {
        currentFile,
        hasWorkspace,
        unsavedFileIds,
        getCurrentContent,
        handleFileSelect,
        handleContentChange,
        handleFileSave,
        handleWorkspaceRead,
        handleFileDelete,
    } = useFileStore();

    const { handleFolderSelect } = useFileExplorer();

    return (
        <ErrorBoundary>
            <Flex h="100vh" w="100vw" overflow="hidden">
                <Flex direction="column" minW="200px" maxW="800px" h="100%">
                    <Flex
                        p={2}
                        bg="white"
                        borderBottom="1px"
                        borderRight="1px"
                        borderColor="gray.200"
                        alignItems="center"
                        justifyContent="space-between"
                        flexShrink={0}
                    >
                        <UserMenu />
                    </Flex>
                    <Box flex={1} minH={0}>
                        <ResizablePanel
                            defaultWidth={250}
                            isResizable="right"
                            minWidth={200}
                            maxWidth={800}
                        >
                            <FileExplorer />
                        </ResizablePanel>
                    </Box>
                </Flex>

                <Box flex="1" minW="300px" w="100%" position="relative">
                    {!hasWorkspace ? (
                        <Box
                            h="100%"
                            bg="gray.50"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                        >
                            <Button
                                colorScheme="blue"
                                onClick={handleFolderSelect} // Call the function to load workspace
                            >
                                Load Workspace Folder
                            </Button>
                        </Box>
                    ) : !currentFile ? (
                        <Box
                            h="100%"
                            bg="gray.50"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                        >
                            <Text color="gray.500" fontSize="lg">
                                Please select a file to edit
                            </Text>
                        </Box>
                    ) : (
                        <Editor
                            content={getCurrentContent()}
                            onChange={handleContentChange}
                            currentFile={currentFile}
                            onSave={handleFileSave}
                        />
                    )}
                </Box>

                <ResizablePanel
                    defaultWidth={400}
                    isResizable="left"
                    minWidth={200}
                    maxWidth={800}
                >
                    <AIChatPanel />
                </ResizablePanel>
            </Flex>
        </ErrorBoundary>
    );
}

// Separate component that uses navigation
function AppRoutes() {
    const navigate = useNavigate();
    const sessionExpired = useAuthStore((state) => state.sessionExpired);

    useEffect(() => {
        APIClient.setNavigate(navigate);
    }, [navigate]);

    return (
        <ErrorBoundary>
            <SessionExpiredModal isOpen={sessionExpired} />
            <Routes>
                <Route path="/auth" element={<AuthPage />} />
                <Route element={<ProtectedLayout />}>
                    <Route path="/" element={<EditorLayout />} />
                    <Route path="/profile" element={<UserDashboard />} />
                </Route>
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </ErrorBoundary>
    );
}

// Main App component that provides Router context
function App() {
    return (
        <BrowserRouter>
            <AppRoutes />
        </BrowserRouter>
    );
}

export default App;
