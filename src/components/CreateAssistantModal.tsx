import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    FormControl,
    FormLabel,
    Input,
    Select,
    VStack,
    useToast,
  } from "@chakra-ui/react";
  import { useState } from "react";
  import { useAssistants } from "../hooks/useAssistants";
  
  interface CreateAssistantModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
  }
  
  export function CreateAssistantModal({ isOpen, onClose, onSuccess }: CreateAssistantModalProps) {
    const [name, setName] = useState("");
    const [provider, setProvider] = useState("deepseek-r1");
    const { createAssistant } = useAssistants();
    const toast = useToast();
  
    const handleSubmit = async () => {
      try {
        await createAssistant.mutateAsync({
          assistant_name: name,
          llm_provider: provider,
        });
        onSuccess();
        onClose();
        setName("");
        toast({
          title: "Assistant created",
          status: "success",
          duration: 3000,
        });
      } catch (error: any) {
        toast({
          title: "Failed to create assistant",
          description: error.response?.data?.detail || "An error occurred",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      }
    };
  
    return (
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Create New Assistant</ModalHeader>
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Assistant Name</FormLabel>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter assistant name"
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>LLM Provider</FormLabel>
                <Select value={provider} onChange={(e) => setProvider(e.target.value)}>
                  <option value="deepseek-r1">Deepseek R1</option>
                </Select>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleSubmit}
              isDisabled={!name}
            >
              Create
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    );
  } 