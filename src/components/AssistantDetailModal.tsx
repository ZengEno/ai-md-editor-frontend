import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    VStack,
    FormControl,
    FormLabel,
    Input,
    IconButton,
    Text,
    Tabs,
    TabList,
    TabPanels,
    Tab,
    TabPanel,
    Box,
    Flex,
    useToast,
} from "@chakra-ui/react";
import { DeleteIcon, AddIcon, EditIcon } from "@chakra-ui/icons";
import { useState, useEffect } from "react";
import { useAssistants } from "../hooks/useAssistants";
import { Assistant } from "../types/assistant";

interface AssistantDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    assistant: Assistant | null;
}

interface AssistantMemoryItemProps {
    content: string;
    onDelete: () => void;
}

const AssistantMemoryItem = ({
    content,
    onDelete,
}: AssistantMemoryItemProps) => (
    <Flex gap={2} alignItems="center">
        <Text flex={1} p={2} borderWidth={1} borderRadius="md">
            {content}
        </Text>
        <IconButton
            aria-label="Delete memory"
            icon={<DeleteIcon />}
            size="sm"
            onClick={onDelete}
        />
    </Flex>
);

interface UserRuleItemProps {
    rule: string;
    onChange: (value: string) => void;
    onDelete: () => void;
}

const UserRuleItem = ({ rule, onChange, onDelete }: UserRuleItemProps) => (
    <Flex gap={2}>
        <Input
            value={rule}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Enter a rule"
        />
        <IconButton
            aria-label="Delete rule"
            icon={<DeleteIcon />}
            size="sm"
            onClick={onDelete}
        />
    </Flex>
);

export function AssistantDetailModal({
    isOpen,
    onClose,
    assistant,
}: AssistantDetailModalProps) {
    const [name, setName] = useState("");
    const [isEditingName, setIsEditingName] = useState(false);
    const [styleGuidelines, setStyleGuidelines] = useState<string[]>([]);
    const [generalFacts, setGeneralFacts] = useState<string[]>([]);
    const [userRules, setUserRules] = useState<string[]>([]);

    const toast = useToast();
    const { updateAssistant } = useAssistants();

    useEffect(() => {
        if (assistant) {
            setName(assistant.assistant_name);
            setIsEditingName(false);
            setStyleGuidelines(assistant.reflections.style_guidelines || []);
            setGeneralFacts(assistant.reflections.general_facts || []);
            setUserRules(assistant.user_defined_rules || []);
        }
    }, [assistant]);

    const handleSave = async () => {
        if (!assistant) return;

        try {
            await updateAssistant.mutateAsync({
                assistant_id: assistant.assistant_id,
                assistant_name: name,
                reflections: {
                    style_guidelines: styleGuidelines,
                    general_facts: generalFacts,
                },
                user_defined_rules: userRules,
            });

            toast({
                title: "Assistant updated",
                status: "success",
                duration: 3000,
            });
            onClose();
        } catch (error) {
            toast({
                title: "Failed to update assistant",
                description:
                    error instanceof Error
                        ? error.message
                        : "An error occurred",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
        }
    };

    const handleUpdateRule = (index: number, value: string) => {
        const newRules = [...userRules];
        newRules[index] = value;
        setUserRules(newRules);
    };

    const handleDeleteRule = (index: number) => {
        setUserRules(userRules.filter((_, i) => i !== index));
    };

    const handleAddRule = () => {
        setUserRules([...userRules, ""]);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="xl">
            <ModalOverlay />
            <ModalContent maxH="90vh">
                <ModalHeader borderBottom="1px" borderColor="gray.200">
                    Assistant Details
                </ModalHeader>
                <ModalBody p={0} overflow="hidden">
                    <VStack spacing={4} p={4} h="full">
                        <FormControl>
                            <FormLabel>Assistant Name</FormLabel>
                            <Flex gap={2}>
                                {isEditingName ? (
                                    <Input
                                        value={name}
                                        onChange={(e) =>
                                            setName(e.target.value)
                                        }
                                        autoFocus
                                    />
                                ) : (
                                    <Text
                                        flex={1}
                                        p={2}
                                        borderWidth={1}
                                        borderRadius="md"
                                        fontWeight="medium"
                                    >
                                        {name}
                                    </Text>
                                )}
                                <IconButton
                                    aria-label={
                                        isEditingName
                                            ? "Save name"
                                            : "Edit name"
                                    }
                                    icon={<EditIcon />}
                                    size="sm"
                                    onClick={() =>
                                        setIsEditingName(!isEditingName)
                                    }
                                />
                            </Flex>
                        </FormControl>

                        <Tabs
                            isFitted
                            variant="enclosed"
                            width="100%"
                            display="flex"
                            flexDirection="column"
                            flex={1}
                        >
                            <TabList>
                                <Tab>Assistant Memories</Tab>
                                <Tab>User Rules</Tab>
                            </TabList>

                            <TabPanels flex={1} overflow="hidden">
                                <TabPanel h="full" overflowY="auto">
                                    <VStack spacing={4} align="stretch">
                                        <Box>
                                            <Text fontWeight="medium" mb={2}>
                                                Style Guidelines
                                            </Text>
                                            <VStack spacing={2} align="stretch">
                                                {styleGuidelines.map(
                                                    (guideline, index) => (
                                                        <AssistantMemoryItem
                                                            key={index}
                                                            content={guideline}
                                                            onDelete={() =>
                                                                setStyleGuidelines(
                                                                    styleGuidelines.filter(
                                                                        (
                                                                            _,
                                                                            i
                                                                        ) =>
                                                                            i !==
                                                                            index
                                                                    )
                                                                )
                                                            }
                                                        />
                                                    )
                                                )}
                                            </VStack>
                                        </Box>
                                        <Box>
                                            <Text fontWeight="medium" mb={2}>
                                                General Facts
                                            </Text>
                                            <VStack spacing={2} align="stretch">
                                                {generalFacts.map(
                                                    (fact, index) => (
                                                        <AssistantMemoryItem
                                                            key={index}
                                                            content={fact}
                                                            onDelete={() =>
                                                                setGeneralFacts(
                                                                    generalFacts.filter(
                                                                        (
                                                                            _,
                                                                            i
                                                                        ) =>
                                                                            i !==
                                                                            index
                                                                    )
                                                                )
                                                            }
                                                        />
                                                    )
                                                )}
                                            </VStack>
                                        </Box>
                                    </VStack>
                                </TabPanel>

                                <TabPanel h="full" overflowY="auto">
                                    <VStack spacing={2} align="stretch">
                                        {userRules.map((rule, index) => (
                                            <UserRuleItem
                                                key={`rule-${index}`}
                                                rule={rule}
                                                onChange={(value) =>
                                                    handleUpdateRule(
                                                        index,
                                                        value
                                                    )
                                                }
                                                onDelete={() =>
                                                    handleDeleteRule(index)
                                                }
                                            />
                                        ))}
                                        <Button
                                            leftIcon={<AddIcon />}
                                            size="sm"
                                            onClick={handleAddRule}
                                        >
                                            Add Rule
                                        </Button>
                                    </VStack>
                                </TabPanel>
                            </TabPanels>
                        </Tabs>
                    </VStack>
                </ModalBody>
                <ModalFooter borderTop="1px" borderColor="gray.200">
                    <Button variant="ghost" mr={3} onClick={onClose}>
                        Cancel
                    </Button>
                    <Button colorScheme="blue" onClick={handleSave}>
                        Save Changes
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}
