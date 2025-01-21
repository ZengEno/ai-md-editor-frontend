import {
    Box,
    Container,
    Tab,
    TabList,
    TabPanel,
    TabPanels,
    Tabs,
    Card,
    Alert,
    AlertIcon,
} from "@chakra-ui/react";
import { LoginForm } from "../components/LoginForm";
import { RegisterForm } from "../components/RegisterForm";
import { useAuthStore } from "../stores/authStore";
import { Navigate } from "react-router-dom";
import { useEffect } from "react";

export function AuthPage() {
    const { isAuthenticated, sessionExpired, setSessionExpired } =
        useAuthStore();

    // Only clear session expired when user successfully logs in
    useEffect(() => {
        if (isAuthenticated) {
            setSessionExpired(false);
        }
    }, [isAuthenticated, setSessionExpired]);

    if (isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    return (
        <Box
            minH="100vh"
            bg="gray.50"
            w="100vw"
            position="absolute"
            left={0}
            top={0}
            display="flex"
            alignItems="center"
            justifyContent="center"
        >
            <Container maxW="md" px={4}>
                <Card p={8} boxShadow="lg" borderRadius="lg">
                    {sessionExpired && (
                        <Alert status="warning" mb={4} borderRadius="md">
                            <AlertIcon />
                            Your session has expired. Please log in again.
                        </Alert>
                    )}
                    <Tabs isFitted variant="enclosed-colored">
                        <TabList mb={2}>
                            <Tab _selected={{ bg: "blue.500", color: "white" }}>
                                Login
                            </Tab>
                            <Tab
                                _selected={{ bg: "blue.500", color: "white" }}
                                ml={1}
                            >
                                Register
                            </Tab>
                        </TabList>
                        <TabPanels>
                            <TabPanel px={0}>
                                <LoginForm />
                            </TabPanel>
                            <TabPanel px={0}>
                                <RegisterForm />
                            </TabPanel>
                        </TabPanels>
                    </Tabs>
                </Card>
            </Container>
        </Box>
    );
}
