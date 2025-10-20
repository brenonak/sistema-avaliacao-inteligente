'use client';

import React from 'react';
import { Button, CircularProgress, Tooltip, Box } from '@mui/material';
import { styled } from '@mui/material/styles';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

/**
 * AIButton - Botão genérico e reutilizável para funcionalidades de IA
 * 
 * @component
 * @param {Object} props - Propriedades do componente
 * @param {string} [props.tooltipText='Gerar com IA'] - Texto do tooltip
 * @param {boolean} [props.loading=false] - Estado de carregamento
 * @param {boolean} [props.disabled=false] - Estado desabilitado
 * @param {Function} [props.onClick] - Função executada ao clicar
 * @param {string} [props.variant='contained'] - Variante do botão (contained, outlined, text)
 * @param {string} [props.size='medium'] - Tamanho do botão (small, medium, large)
 * @param {string} [props.label='Gerar com IA'] - Texto do botão
 * @param {boolean} [props.iconOnly=false] - Mostrar apenas o ícone
 * @param {string} [props.color='primary'] - Cor do botão
 * 
 * @example
 * // Botão padrão
 * <AIButton onClick={handleGenerateWithAI} />
 * 
 * @example
 * // Botão com loading
 * <AIButton loading={true} tooltipText="Gerando..." />
 * 
 * @example
 * // Botão customizado
 * <AIButton 
 *   tooltipText="Revisar Texto"
 *   label="Revisar"
 *   variant="outlined"
 *   onClick={handleReview}
 * />
 * 
 * @example
 * // Apenas ícone
 * <AIButton iconOnly tooltipText="Gerar com IA" onClick={handleGenerate} />
 */

// Botão estilizado com tema consistente com outros botões do projeto
const StyledAIButton = styled(Button)(({ theme, variant }) => ({
  position: 'relative',
  overflow: 'hidden',
  borderRadius: theme.shape?.borderRadius || 4,
  textTransform: 'none',
  fontWeight: 500, // Mais sutil que 600
  letterSpacing: 'normal',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  
  // Estilo comum para todas as variantes (seguindo padrão do Material-UI)
  '&:hover': {
    transform: 'translateY(-1px)',
    boxShadow: theme.shadows?.[2] || '0px 2px 4px rgba(0,0,0,0.1)',
  },
  
  // Animação de pressionar
  '&:active': {
    transform: 'translateY(0px)',
    transition: 'transform 0.1s',
  },
  
  // Estado desabilitado
  '&.Mui-disabled': {
    transform: 'none',
    boxShadow: 'none',
  },
}));

// Ícone com animação sutil (sem rotação)
const AnimatedIcon = styled(AutoAwesomeIcon)(({ theme }) => ({
  transition: 'transform 0.3s ease-in-out',
  
  // Animação no hover do botão pai (apenas escala, sem rotação)
  '.MuiButton-root:hover &': {
    transform: 'scale(1.1)',
  },
  
  // Parar animação quando desabilitado
  '.MuiButton-root.Mui-disabled &': {
    transform: 'none',
  },
}));

const AIButton = ({
  tooltipText = 'Gerar com IA',
  loading = false,
  disabled = false,
  onClick,
  variant = 'contained',
  size = 'medium',
  label = 'Gerar com IA',
  iconOnly = false,
  color = 'primary',
  ...otherProps
}) => {
  const handleClick = (event) => {
    if (!loading && !disabled && onClick) {
      onClick(event);
    }
  };

  const buttonContent = (
    <StyledAIButton
      variant={variant}
      size={size}
      color={color}
      disabled={disabled || loading}
      onClick={handleClick}
      startIcon={!iconOnly && !loading ? <AnimatedIcon /> : null}
      sx={{
        ...(iconOnly && {
          minWidth: 'auto',
          width: size === 'small' ? 36 : size === 'large' ? 56 : 48,
          height: size === 'small' ? 36 : size === 'large' ? 56 : 48,
          padding: 0,
        }),
      }}
      {...otherProps}
    >
      {loading ? (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CircularProgress
            size={size === 'small' ? 16 : size === 'large' ? 24 : 20}
            color="inherit"
            thickness={5}
          />
          {!iconOnly && 'Gerando...'}
        </Box>
      ) : iconOnly ? (
        <AnimatedIcon fontSize={size} />
      ) : (
        label
      )}
    </StyledAIButton>
  );

  return (
    <Tooltip 
      title={loading ? 'Aguarde, processando...' : tooltipText}
      arrow
      placement="top"
      enterDelay={500}
    >
      <span>{buttonContent}</span>
    </Tooltip>
  );
};

export default AIButton;
