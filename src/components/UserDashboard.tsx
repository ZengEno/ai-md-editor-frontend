import { useState, useEffect } from 'react'
import { useAuthStore } from '../stores/authStore'
import { APIClient } from '../services/APIClient'
import { useNavigate } from 'react-router-dom'
import {
  Button,
  Flex,
  Box,
  VStack,
  Text,
  Container,
  Heading,
  Alert,
  AlertIcon,
  Divider,
  Card,
  CardBody,
  Stack,
  Badge,
  Spinner,
  Code,
} from '@chakra-ui/react'
import { ArrowBackIcon } from '@chakra-ui/icons'

interface UserInfo {
  user_id: string
  user_nickname: string
  email: string
  created_at: string
  last_login: string
}

export function UserDashboard() {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const logout = useAuthStore((state) => state.logout)
  const navigate = useNavigate()

  useEffect(() => {
    loadUserInfo()
  }, [])

  const loadUserInfo = async () => {
    try {
      const info = await APIClient.getUserInfo()
      setUserInfo(info)
      setError('')
    } catch (err: any) {
      setError('Failed to load user information')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await APIClient.logout()
      logout()
    } catch (err) {
      logout()
    }
  }

  if (isLoading) {
    return (
      <Flex justify="center" align="center" h="100vh">
        <Spinner size="xl" color="blue.500" />
      </Flex>
    )
  }

  return (
    <Flex 
      justify="center" 
      align="center" 
      minH="100vh" 
      bg="gray.50" 
      w="100vw" 
      position="absolute" 
      left={0} 
      top={0} 
    >
      <Container maxW="md" py={8} px={4}>
        <Card boxShadow="lg" borderRadius="lg" maxW="400px" mx="auto">
          <CardBody>
            <Heading size="lg" mb={6} textAlign="center">User Profile</Heading>

            {error && (
              <Alert status="error" mb={6} borderRadius="md">
                <AlertIcon />
                {error}
              </Alert>
            )}

            {userInfo && (
              <Stack spacing={6}>
                <VStack align="stretch" spacing={4}>
                  <Box>
                    <Text fontWeight="bold" color="gray.500" fontSize="sm">
                      NICKNAME
                    </Text>
                    <Text fontSize="lg">{userInfo.user_nickname}</Text>
                  </Box>

                  <Box>
                    <Text fontWeight="bold" color="gray.500" fontSize="sm">
                      EMAIL
                    </Text>
                    <Text fontSize="lg">{userInfo.email}</Text>
                  </Box>

                  <Box>
                    <Text fontWeight="bold" color="gray.500" fontSize="sm">
                      MEMBER SINCE
                    </Text>
                    <Text fontSize="lg">
                      {new Date(userInfo.created_at).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </Text>
                  </Box>

                  <Box>
                    <Text fontWeight="bold" color="gray.500" fontSize="sm">
                      LAST LOGIN
                    </Text>
                    <Text fontSize="lg">
                      {new Date(userInfo.last_login).toLocaleString()}
                    </Text>
                  </Box>
                </VStack>

                <Divider />

                <VStack spacing={4} width="full">
                  <Button
                    colorScheme="blue"
                    onClick={() => navigate('/')}
                    width="full"
                    leftIcon={<ArrowBackIcon />}
                  >
                    Back to Editor
                  </Button>
                  
                  <Button
                    colorScheme="red"
                    onClick={handleLogout}
                    width="full"
                  >
                    Logout
                  </Button>
                </VStack>
              </Stack>
            )}
          </CardBody>
        </Card>
      </Container>
    </Flex>
  )
} 