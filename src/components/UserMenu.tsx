import {
    Menu,
    MenuButton,
    MenuList,
    MenuItem,
    Button,
    Avatar,
    Text,
    MenuDivider,
    Flex,
} from "@chakra-ui/react";
import { useAuthStore } from "../stores/authStore";
import { APIClient } from "../services/APIClient";
import { useNavigate } from "react-router-dom";

export function UserMenu() {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await APIClient.logout();
            logout();
            navigate("/auth");
        } catch (err) {
            logout();
            navigate("/auth");
        }
    };

    return (
        <Menu>
            <MenuButton
                as={Button}
                variant="ghost"
                display="flex"
                alignItems="center"
            >
                <Flex alignItems="center">
                    <Avatar size="sm" name={user?.nickname} mr={2} />
                    <Text>{user?.nickname}</Text>
                </Flex>
            </MenuButton>
            <MenuList>
                <MenuItem onClick={() => navigate("/profile")}>
                    Profile
                </MenuItem>
                <MenuDivider />
                <MenuItem onClick={handleLogout} color="red.500">
                    Logout
                </MenuItem>
            </MenuList>
        </Menu>
    );
}
