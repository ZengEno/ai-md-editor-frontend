import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    Text,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";

interface SessionExpiredModalProps {
    isOpen: boolean;
}

export function SessionExpiredModal({ isOpen }: SessionExpiredModalProps) {
    const navigate = useNavigate();
    const logout = useAuthStore((state) => state.logout);

    const handleRedirect = () => {
        logout();
        navigate("/auth");
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={() => {}}
            isCentered
            closeOnOverlayClick={false}
        >
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>Session Expired</ModalHeader>
                <ModalBody>
                    <Text>
                        Your session has expired. Please log in again to
                        continue.
                    </Text>
                </ModalBody>
                <ModalFooter>
                    <Button colorScheme="blue" onClick={handleRedirect}>
                        Go to Login
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}
