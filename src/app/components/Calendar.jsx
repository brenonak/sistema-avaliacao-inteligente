"use client";
import { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import { DateCalendar, DayCalendarSkeleton } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import 'dayjs/locale/pt-br';
import { PickersDay } from '@mui/x-date-pickers/PickersDay';
import Badge from '@mui/material/Badge';
import IconButton from '@mui/material/IconButton';
import AssignmentIcon from '@mui/icons-material/Assignment';
import QuizIcon from '@mui/icons-material/Quiz';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';

// Componente utilizado para mostrar os dias marcados no calendário
function ServerDay(props) {
  const { day, outsideCurrentMonth, events = [], iconColor, ...other } = props;

  // Filtrar eventos do dia atual
  const dayEvents = events.filter(event => {
    const eventDate = dayjs(event.date);
    return eventDate.date() === day.date() && 
           eventDate.month() === day.month() && 
           eventDate.year() === day.year();
  });

  const hasEvents = !outsideCurrentMonth && dayEvents.length > 0;
  const hasProva = dayEvents.some(e => e.type === 'PROVA');
  const hasLista = dayEvents.some(e => e.type === 'LISTA');

  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenuOpen = (event) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleClose = (event) => {
    if (event) event.stopPropagation();
    setAnchorEl(null);
  };

  // Determinar cor do ícone baseado no tipo de evento
  const getIconColor = () => {
    if (hasProva && hasLista) return '#ff9800'; // Laranja para ambos
    if (hasProva) return '#f44336'; // Vermelho para prova
    if (hasLista) return '#2196f3'; // Azul para lista
    return iconColor ?? 'accent.main';
  };

  return (
    <Badge
      key={day.toString()}
      overlap="circular"
      badgeContent={
        hasEvents ? (
          <div 
            style={{ 
              width: 20, 
              height: 20, 
              zIndex: 2,
              position: 'absolute',
            }}
          >
            <IconButton
              size="small"
              onClick={handleMenuOpen}
              sx={{
                p: 0,
                width: '100%',
                height: '100%',
                minWidth: 0,
                position: 'absolute',
                zIndex: 2,
                top: 0,
                left: 0,
              }}
            >
              {hasProva ? (
                <QuizIcon sx={{ fontSize: 14, color: getIconColor() }} />
              ) : (
                <AssignmentIcon sx={{ fontSize: 14, color: getIconColor() }} />
              )}
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
              {dayEvents.map((event, idx) => (
                <MenuItem key={idx} onClick={handleClose} sx={{ py: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip 
                      label={event.type === 'PROVA' ? 'Prova' : 'Lista'} 
                      size="small" 
                      color={event.type === 'PROVA' ? 'error' : 'info'}
                      sx={{ fontSize: 10, height: 20 }}
                    />
                    <Typography variant="body2">{event.title}</Typography>
                  </Box>
                </MenuItem>
              ))}
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

export default function Calendar({ iconColor, events = [] }) {
  // A data selecionada no calendário (valor inicial: null para evitar SSR mismatch)
  const [selectedDate, setSelectedDate] = useState(null);

  // Estado de carregamento
  const [isLoading, setIsLoading] = useState(false);

  // Filtrar eventos do mês atual
  const [currentMonthEvents, setCurrentMonthEvents] = useState([]);

  useEffect(() => {
    // Define a data no lado do cliente para garantir que a timezone correta seja usada
    setSelectedDate(dayjs());
  }, []);

  useEffect(() => {
    if (selectedDate && events.length > 0) {
      const filtered = events.filter(event => {
        const eventDate = dayjs(event.date);
        return eventDate.month() === selectedDate.month() && 
               eventDate.year() === selectedDate.year();
      });
      setCurrentMonthEvents(filtered);
    }
  }, [selectedDate, events]);

  // Função chamada ao mudar o mês
  const handleMonthChange = (newMonth) => {
    setSelectedDate(newMonth);
  };

  // Renderiza um esqueleto de carregamento até que a data seja definida no cliente
  if (!selectedDate) {
    return (
      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-br">
        <DayCalendarSkeleton />
      </LocalizationProvider>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-br">
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          width: "100%",
          py: 2,
          transform: "scale(1.1)",   
          transformOrigin: "center", 
        }}
      >
        <DateCalendar
          value={selectedDate}
          onChange={() => {}}
          shouldDisableDate={() => false}
          loading={isLoading}
          onMonthChange={handleMonthChange}
          renderLoading={() => <DayCalendarSkeleton />}
          slots={{ day: ServerDay }}
          slotProps={{
            day: { events: currentMonthEvents, iconColor }
          }}
        />
      </Box>
      
      {/* Legenda */}
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <QuizIcon sx={{ fontSize: 14, color: '#f44336' }} />
          <Typography variant="caption" color="text.secondary">Prova</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <AssignmentIcon sx={{ fontSize: 14, color: '#2196f3' }} />
          <Typography variant="caption" color="text.secondary">Lista</Typography>
        </Box>
      </Box>
    </LocalizationProvider>
  );
}
