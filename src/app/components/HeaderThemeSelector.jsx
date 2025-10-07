'use client';

import { useColorScheme } from '@mui/material';
import { IconButton, Menu, MenuItem, Tooltip } from '@mui/material';
import { Brightness4, Brightness7, SettingsBrightness } from '@mui/icons-material';
import { useState } from 'react';

export default function HeaderThemeSelector() {
  const { mode, setMode } = useColorScheme();
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleModeChange = (newMode) => {
    setMode(newMode);
    handleClose();
  };

  const getIcon = () => {
    switch (mode) {
      case 'light':
        return <Brightness7 />;
      case 'dark':
        return <Brightness4 />;
      default:
        return <SettingsBrightness />;
    }
  };

  const getTooltip = () => {
    switch (mode) {
      case 'light':
        return 'Tema claro';
      case 'dark':
        return 'Tema escuro';
      default:
        return 'Tema do sistema';
    }
  };

  return (
    <>
      <Tooltip title={getTooltip()}>
        <IconButton
          onClick={handleClick}
          sx={{
            color: 'text.primary',
            mr: 1,
          }}
        >
          {getIcon()}
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        disableScrollLock={true}
      >
        <MenuItem 
          onClick={() => handleModeChange('system')}
          selected={mode === 'system'}
        >
          <SettingsBrightness sx={{ mr: 1 }} />
          Sistema
        </MenuItem>
        <MenuItem 
          onClick={() => handleModeChange('light')}
          selected={mode === 'light'}
        >
          <Brightness7 sx={{ mr: 1 }} />
          Claro
        </MenuItem>
        <MenuItem 
          onClick={() => handleModeChange('dark')}
          selected={mode === 'dark'}
        >
          <Brightness4 sx={{ mr: 1 }} />
          Escuro
        </MenuItem>
      </Menu>
    </>
  );
}