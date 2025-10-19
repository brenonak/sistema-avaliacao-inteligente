"use client";

import React, { useState } from 'react';
import IconButton from '@mui/material/IconButton';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import MenuItem from '@mui/material/MenuItem';
import Menu from '@mui/material/Menu';


export default function CardOptionsButton({ cursoId, onDelete }) {
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenu = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleDelete = (event) => {
    event.preventDefault();
    event.stopPropagation();
    handleClose();
    if (onDelete && cursoId) {
      onDelete(cursoId);
    }
  };

  const handleEdit = (event) => {
    event.preventDefault();
    event.stopPropagation();
    handleClose();
    // Implementar edição futuramente
    console.log('Editar curso:', cursoId);
  };

  // Se não há funções específicas, retorna apenas o ícone sem menu
  if (!cursoId && !onDelete) {
    return (
      <IconButton
        size="large"
        aria-label="options"
        color="inherit"
        disabled
      >
        <MoreVertIcon />
      </IconButton>
    );
  }

  return (
    <div>
      <IconButton
        size="large"
        aria-label="course options"
        aria-controls="menu-appbar"
        aria-haspopup="true"
        onClick={handleMenu}
        color="inherit"
      >
        <MoreVertIcon />
      </IconButton>
      <Menu
        id="menu-appbar"
        anchorEl={anchorEl}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        keepMounted
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        disableScrollLock={true}
      >
        <MenuItem onClick={handleEdit}>Editar</MenuItem>
        <MenuItem onClick={handleDelete}>Excluir</MenuItem>
      </Menu>
    </div>
  );
}