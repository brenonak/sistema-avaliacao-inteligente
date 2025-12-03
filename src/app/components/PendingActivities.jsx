"use client";
import React from "react";
import {
  Box,
  Typography,
  List,
  Divider,
  ButtonBase,
  Chip,
} from "@mui/material";
import { useRouter } from "next/navigation";

export default function PendingActivities({ activities = [] }) {
  const router = useRouter();

  const handleActivityClick = (activity) => {
    if (activity.type === 'PROVA') {
      router.push(`/aluno/cursos/${activity.cursoId}/provas/${activity.id}`);
    } else if (activity.type === 'LISTA') {
      router.push(`/aluno/cursos/${activity.cursoId}/listas/${activity.id}`);
    }
  };

  return (
    <>
      {activities.length === 0 ? (
        <Typography sx={{ color: "text.secondary" }}>
          Nenhuma atividade pendente
        </Typography>
      ) : (
        <List dense sx={{ width: "100%" }}>
          {activities.map((task, i) => (
            <Box key={task.id || i} sx={{ width: "100%" }}>
              <ButtonBase
                sx={{
                  width: "100%",
                  borderRadius: 1,
                  textAlign: "left",
                  alignItems: "start",
                  p: 1.5,
                  display: "block",
                  "&:hover": {
                    backgroundColor: "action.hover",
                  },
                }}
                onClick={() => handleActivityClick(task)}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <Chip 
                    label={task.type === 'PROVA' ? 'Prova' : 'Lista'} 
                    size="small" 
                    color={task.type === 'PROVA' ? 'error' : 'info'}
                    sx={{ fontSize: 10, height: 20 }}
                  />
                  <Typography
                    variant="body2"
                    sx={{ fontSize: 14, fontWeight: 500 }}
                  >
                    {task.title}
                  </Typography>
                </Box>

                <Typography
                  variant="caption"
                  sx={{
                    display: "block",
                    color: "text.secondary",
                    mt: 0.5,
                  }}
                >
                  {task.due}
                </Typography>
              </ButtonBase>

              {i < activities.length - 1 && <Divider sx={{ my: 1 }} />}
            </Box>
          ))}
        </List>
      )}
    </>
  );
}
