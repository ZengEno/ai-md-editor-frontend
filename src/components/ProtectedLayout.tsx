import { Box, Flex } from "@chakra-ui/react"
import { useAuthStore } from "../stores/authStore"
import { Navigate, Outlet } from "react-router-dom"

export function ProtectedLayout() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />
  }

  return (
    <Box h="100vh">
      <Outlet />
    </Box>
  )
} 