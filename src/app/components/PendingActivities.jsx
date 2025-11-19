"use client";
import React from "react";
import {
  Box,
  Typography,
  List,
  Divider,
  ButtonBase,
} from "@mui/material";

export default function PendingActivities({ activities = [] }) {
  return (
    <>
      {activities.length === 0 ? (
        <Typography sx={{ color: "text.secondary" }}>
          Nenhuma atividade pendente
        </Typography>
      ) : (
        <List dense sx={{ width: "100%" }}>
          {activities.map((task, i) => (
            <Box key={i} sx={{ width: "100%" }}>
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
                // TODO: Implementar a ação ao clicar na atividade
                onClick={() => {}}
              >
                <Typography
                  variant="body2"
                  sx={{ fontSize: 14, fontWeight: 500 }}
                >
                  {task.title}
                </Typography>

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
