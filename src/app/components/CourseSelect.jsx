'use client';
import React from 'react';
import {
  Card,
  Box,
  Typography,
  FormControl,
  Select,
  MenuItem,
  useTheme,
} from '@mui/material';

export default function CourseSelect({ courses, selectedCourse, onCourseChange }) {
  const theme = useTheme();

  return (
    <Card
      sx={{
        borderRadius: 2,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        p: 2.5,
      }}
    >
      <Box sx={{ width: '100%' }}>
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
          Curso Selecionado
        </Typography>

        <FormControl fullWidth>
          <Select
            value={selectedCourse}
            onChange={(e) => onCourseChange(e.target.value)}
            MenuProps={{
              disableScrollLock: true, 
            }}
            sx={{
              borderRadius: 2,
              fontWeight: 500,
              backgroundColor: 'inherit',
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: 'transparent', 
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: theme.palette.primary.main, 
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: 'transparent', 
              },
              '& .MuiSelect-select': {
                px: 1.5,
                py: 1.2,
              },
              transition: 'border-color 0.2s ease, background-color 0.2s ease',
            }}
          >
            {courses.map((course) => (
              <MenuItem key={course.id} value={course.id}>
                {course.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
    </Card>
  );
}
