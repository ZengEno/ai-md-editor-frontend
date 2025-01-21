import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  FormControl,
  FormLabel,
  FormErrorMessage,
} from '@chakra-ui/react'
import { useState, useEffect } from 'react'
import { FileNameValidator } from '../utils/fileValidation';

interface CreateFileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateFile: (fileName: string) => void;
  defaultFileName?: string;
  existingFiles: string[];
}

const CreateFileModal = ({ 
  isOpen, 
  onClose, 
  onCreateFile, 
  defaultFileName,
  existingFiles 
}: CreateFileModalProps) => {
  const [fileName, setFileName] = useState('')
  const [error, setError] = useState<string>('')

  useEffect(() => {
    if (isOpen && defaultFileName) {
      setFileName(defaultFileName);
      setError('');
    }
  }, [isOpen, defaultFileName]);

  const validateFileName = (name: string) => {
    const result = FileNameValidator.validate(name, {
        existingFiles
    });
    return result.error;
  };

  const handleCreate = () => {
    if (!fileName.trim()) return;
    
    const finalName = FileNameValidator.sanitizeName(fileName);
    const error = validateFileName(fileName);
    
    if (error) {
        setError(error);
        return;
    }

    onCreateFile(finalName);
    onClose();
    setFileName('');
    setError('');
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setFileName(newName);
    setError(validateFileName(newName));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Create New Text File</ModalHeader>
        <ModalBody>
          <FormControl isInvalid={!!error}>
            <FormLabel>File Name</FormLabel>
            <Input
              value={fileName}
              onChange={handleChange}
              placeholder="Enter file name"
              autoFocus
            />
            <FormErrorMessage>{error}</FormErrorMessage>
          </FormControl>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button 
            colorScheme="blue" 
            onClick={handleCreate}
            isDisabled={!!error || !fileName.trim()}
          >
            Create
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

export default CreateFileModal 