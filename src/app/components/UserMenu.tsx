/**
 * Componente de exemplo: UserMenu
 * 
 * Demonstra como usar autenticação em Client Components
 * Exibe menu com foto do usuário quando autenticado
 */

'use client';

import { useSession, signIn, signOut } from "next-auth/react";
import { 
  Avatar, 
  Button, 
  Menu, 
  MenuItem, 
  IconButton, 
  CircularProgress,
  Box,
  Typography 
} from "@mui/material";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function UserMenu() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSignOut = async () => {
    handleClose();
    await signOut({ callbackUrl: "/" });
  };

  const handleDashboard = () => {
    handleClose();
    router.push("/dashboard");
  };

  // Loading state
  if (status === "loading") {
    return <CircularProgress size={24} />;
  }

  // Not authenticated
  if (status === "unauthenticated") {
    return (
      <Button
        variant="outlined"
        onClick={() => signIn("google")}
        size="small"
      >
        Entrar
      </Button>
    );
  }

  // Authenticated
  if (!session) {
    return null;
  }

  return (
    <Box>
      <IconButton
        onClick={handleClick}
        size="small"
        aria-controls={open ? 'user-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
      >
        <Avatar
          alt={session.user?.name || "User"}
          src={session.user?.image || undefined}
          sx={{ width: 32, height: 32 }}
        />
      </IconButton>
      
      <Menu
        id="user-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'user-button',
        }}
      >
        <Box sx={{ px: 2, py: 1, minWidth: 200 }}>
          <Typography variant="subtitle2" noWrap>
            {session.user?.name}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            {session.user?.email}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }} noWrap>
            ID: {(session.user as any)?.id || 'N/A'}
          </Typography>
        </Box>
        
        <MenuItem onClick={handleDashboard}>
          Dashboard
        </MenuItem>
        
        <MenuItem onClick={() => { handleClose(); router.push("/debug-auth"); }}>
          Debug Auth
        </MenuItem>
        
        <MenuItem onClick={handleSignOut}>
          Sair
        </MenuItem>
      </Menu>
    </Box>
  );
}
