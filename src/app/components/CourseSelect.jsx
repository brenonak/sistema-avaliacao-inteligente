'use client';
import React from 'react';
import { Box, TextField, MenuItem } from '@mui/material';

// TODO: A estilização do TextField apresentou dificuldades, e é necessário corrigí-las.

export default function CourseSelect({ courses = [], selectedCourse = '', onCourseChange, sx = {} }) {
  const displayCourses = (courses && courses.length) ? courses : [{ id: 'todos', name: 'Todos os cursos' }];

  return (
    <Box
      sx={{
        flex: { xs: '1 1 100%', md: '0 0 50%' },
        display: 'flex',
        alignItems: { xs: 'flex-start', md: 'center' },
        justifyContent: 'flex-end',
        minHeight: { md: 120 }, // manter altura igual aos cards de desempenho
        ...sx,
      }}
    >
      <TextField
        select
        label="Curso"
        value={selectedCourse || ''}
        onChange={(e) => onCourseChange?.(e.target.value)}
        size="small"
        variant="outlined"
        slotProps={{
          select: {
            MenuProps: { PaperProps: { sx: { maxHeight: 320 } } },
          },
        }}
        sx={{
          width: '100%',
          '& .MuiOutlinedInput-root': {
            height: '100%',               
            alignItems: 'center',
            borderRadius: 3,
            backgroundColor: 'background.paper',
            boxShadow: 3,
          },
        }}
      >
        {displayCourses.map((c) => (
          <MenuItem key={c.id ?? c} value={c.id ?? c}>
            {c.name ?? c}
          </MenuItem>
        ))}
      </TextField>
    </Box>
  );
}