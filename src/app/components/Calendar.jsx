"use client";
import { useState } from 'react';
import dayjs from 'dayjs';
import { DateCalendar, DayCalendarSkeleton } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import 'dayjs/locale/pt-br';
import { PickersDay } from '@mui/x-date-pickers/PickersDay';
import Badge from '@mui/material/Badge';
import IconButton from '@mui/material/IconButton';
import AssignmentIcon from '@mui/icons-material/Assignment';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';

// Componente utilizado para mostrar os dias marcados no calendário
function ServerDay(props) {
  const { day, outsideCurrentMonth, highlightedDays = [], ...other } = props;

  const isSelected = !outsideCurrentMonth && highlightedDays.includes(day.date());

  const handleMenuOpen = (event) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleClose = (event) => {
    event.stopPropagation();
    setAnchorEl(null);
  };

  const [anchorEl, setAnchorEl] = useState(null);

  return (
    <Badge
      key={day.toString()}
      overlap="circular"
      badgeContent={
        isSelected ? (
          <div style={{ width: 20, height: 20, position: 'absolute' }}>
            <IconButton
              size="small"
              onClick={handleMenuOpen}
              sx={{
                p: 0,
                width: '100%',
                height: '100%',
                minWidth: 0,
                bgcolor: 'white',
                position: 'absolute',
                top: 0,
                left: 0,
                '&:hover': { bgcolor: 'grey.200' },
              }}
            >
              <AssignmentIcon sx={{ fontSize: 14 }} />
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleClose}
              anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              onClick={(e) => e.stopPropagation()}
              disableScrollLock={true}
            >
              <MenuItem onClick={handleClose}>Tarefa 1</MenuItem>
              <MenuItem onClick={handleClose}>Tarefa 2</MenuItem>
            </Menu>
          </div>
        ) : undefined
      }
    >
      <PickersDay
        {...other}
        outsideCurrentMonth={outsideCurrentMonth}
        day={day}
      />
    </Badge>

  );
}

export default function Calendar() {
  // A data selecionada no calendário (valor inicial: hoje)
  const [selectedDate, setSelectedDate] = useState(dayjs());

  // Estado de carregamento para simular busca de dados do servidor
  const [isLoading, setIsLoading] = useState(false);

  // Dias destacados (com tarefas) - inicialmente 1, 5 e 10
  const [highlightedDays, setHighlightedDays] = useState([1, 5, 10]);

  // Função chamada ao mudar o mês, simula busca de dados do servidor
  const handleMonthChange = (newMonth) => {
    setIsLoading(true);
    // Simula uma chamada de API com timeout
    setTimeout(() => {
      // Gera 3 dias aleatórios para destacar no mês
      const newDays = Array.from({ length: 3 }, () => Math.floor(Math.random() * 28) + 1);
      setHighlightedDays(newDays);
      setIsLoading(false);
    }, 1000);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-br">
      <DateCalendar
        value={selectedDate}
        onChange={(newDate) => setSelectedDate(newDate)}
        loading={isLoading}
        onMonthChange={handleMonthChange}
        renderLoading={() => <DayCalendarSkeleton />}
        slots={{ day: ServerDay }}
        slotProps={{
          day: {
            highlightedDays,
          }
        }}
      />
    </LocalizationProvider>
  );
}
