import React from 'react';
import {
    Box,
    Heading,
    Text,
    Button,
    VStack,
    Code,
} from '@chakra-ui/react';

interface Props {
    children: React.ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return {
            hasError: true,
            error,
        };
    }

    public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    private handleReset = () => {
        this.setState({
            hasError: false,
            error: null,
        });
    };

    public render() {
        if (this.state.hasError) {
            return (
                <Box p={8}>
                    <VStack spacing={4} align="start">
                        <Heading size="lg" color="red.500">
                            Something went wrong
                        </Heading>
                        <Text>
                            The application encountered an unexpected error. You can try:
                        </Text>
                        <VStack spacing={2} align="start">
                            <Button
                                onClick={this.handleReset}
                                colorScheme="blue"
                                size="sm"
                            >
                                Reset This Component
                            </Button>
                            <Button
                                onClick={() => window.location.reload()}
                                variant="ghost"
                                size="sm"
                            >
                                Reload Page
                            </Button>
                        </VStack>
                        {this.state.error && (
                            <Box mt={4}>
                                <Text fontWeight="bold" mb={2}>
                                    Error Details:
                                </Text>
                                <Code p={4} borderRadius="md" width="100%">
                                    {this.state.error.message}
                                </Code>
                            </Box>
                        )}
                    </VStack>
                </Box>
            );
        }

        return this.props.children;
    }
} 