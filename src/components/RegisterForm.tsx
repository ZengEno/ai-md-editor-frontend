import { useState } from 'react'
import { APIClient } from '../services/APIClient'
import {
  VStack,
  FormControl,
  FormLabel,
  Input,
  Button,
  Alert,
  AlertIcon,
  FormErrorMessage,
} from '@chakra-ui/react'

export function RegisterForm() {
  const [email, setEmail] = useState('')
  const [nickname, setNickname] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setIsLoading(true)
    
    try {
      await APIClient.register({
        email,
        user_nickname: nickname,
        password
      })
      setSuccess('Registration successful! You can now login.')
      setEmail('')
      setNickname('')
      setPassword('')
    } catch (err: any) {
      setError(
        err.response?.data?.message || 
        'Registration failed. Please try again.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <VStack spacing={4}>
        {error && (
          <Alert status="error" borderRadius="md">
            <AlertIcon />
            {error}
          </Alert>
        )}
        {success && (
          <Alert status="success" borderRadius="md">
            <AlertIcon />
            {success}
          </Alert>
        )}

        <FormControl isRequired>
          <FormLabel>Email</FormLabel>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            size="lg"
          />
        </FormControl>

        <FormControl isRequired>
          <FormLabel>Nickname</FormLabel>
          <Input
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="Choose a nickname"
            size="lg"
          />
        </FormControl>

        <FormControl isRequired>
          <FormLabel>Password</FormLabel>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Create a password"
            size="lg"
          />
        </FormControl>

        <Button
          type="submit"
          colorScheme="blue"
          size="lg"
          width="full"
          isLoading={isLoading}
          loadingText="Registering..."
        >
          Register
        </Button>
      </VStack>
    </form>
  )
} 