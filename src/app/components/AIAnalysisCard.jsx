'use client';

import React, { useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  IconButton,
  Collapse,
  Skeleton,
  Chip,
  Divider,
  alpha,
  useTheme,
} from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import RefreshIcon from '@mui/icons-material/Refresh';

// Animação de brilho pulsante
const shimmer = keyframes`
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
`;

const pulse = keyframes`
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
`;

// Card estilizado com gradiente e efeitos visuais
const StyledCard = styled(Card)(({ theme }) => ({
  position: 'relative',
  borderRadius: theme.shape.borderRadius * 2,
  overflow: 'hidden',
  background: theme.palette.mode === 'dark'
    ? `linear-gradient(135deg, ${alpha(theme.palette.primary.dark, 0.15)} 0%, ${alpha(theme.palette.secondary.dark, 0.1)} 100%)`
    : `linear-gradient(135deg, ${alpha(theme.palette.primary.light, 0.08)} 0%, ${alpha(theme.palette.secondary.light, 0.05)} 100%)`,
  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
  boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.1)}`,
  transition: 'all 0.3s ease-in-out',
  
  '&:hover': {
    boxShadow: `0 8px 30px ${alpha(theme.palette.primary.main, 0.15)}`,
    border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
  },
  
  // Borda decorativa com gradiente
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '4px',
    background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main}, ${theme.palette.primary.main})`,
    backgroundSize: '200% 100%',
    animation: `${shimmer} 3s linear infinite`,
  },
}));

// Header do card com ícone
const CardHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: theme.spacing(2),
}));

// Container do ícone com efeito de fundo
const IconContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 48,
  height: 48,
  borderRadius: '50%',
  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
  boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.4)}`,
  
  '& svg': {
    color: theme.palette.common.white,
    fontSize: 24,
  },
}));

// Ícone com animação de pulsação durante loading
const AnimatedIcon = styled(AutoAwesomeIcon)(({ loading }) => ({
  animation: loading === 'true' ? `${pulse} 1.5s ease-in-out infinite` : 'none',
}));

// Botão de expandir com rotação
const ExpandButton = styled(IconButton)(({ expanded }) => ({
  transform: expanded === 'true' ? 'rotate(180deg)' : 'rotate(0deg)',
  transition: 'transform 0.3s ease-in-out',
}));

// Container para markdown com estilos
const MarkdownContainer = styled(Box)(({ theme }) => ({
  '& h1, & h2, & h3, & h4, & h5, & h6': {
    color: 'var(--mui-palette-text-primary)',
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(1),
    fontWeight: 600,
  },
  '& h1': { fontSize: '1.5rem' },
  '& h2': { fontSize: '1.25rem' },
  '& h3': { fontSize: '1.1rem' },
  '& h4, & h5, & h6': { fontSize: '1rem' },
  
  '& p': {
    color: 'var(--mui-palette-text-secondary)',
    marginBottom: theme.spacing(1.5),
    lineHeight: 1.7,
  },
  
  '& ul, & ol': {
    paddingLeft: theme.spacing(3),
    marginBottom: theme.spacing(1.5),
    color: 'var(--mui-palette-text-secondary)',
  },
  
  '& li': {
    marginBottom: theme.spacing(0.5),
    lineHeight: 1.6,
  },
  
  '& strong': {
    color: 'var(--mui-palette-text-primary)',
    fontWeight: 600,
  },
  
  '& code': {
    backgroundColor: alpha(theme.palette.primary.main, 0.1),
    padding: '2px 6px',
    borderRadius: 4,
    fontSize: '0.875rem',
    fontFamily: 'monospace',
    color: 'var(--mui-palette-text-primary)',
  },
  
  '& blockquote': {
    borderLeft: `4px solid ${theme.palette.primary.main}`,
    paddingLeft: theme.spacing(2),
    marginLeft: 0,
    marginRight: 0,
    fontStyle: 'italic',
    color: 'var(--mui-palette-text-secondary)',
  },
}));

/**
 * Renderizador simples de Markdown para React
 * Suporta: headers, listas, negrito, itálico, código inline
 */
function SimpleMarkdownRenderer({ content }) {
  const rendered = useMemo(() => {
    if (!content) return null;
    
    const lines = content.split('\n');
    const elements = [];
    let currentList = null;
    let listItems = [];
    let key = 0;

    const parseInlineFormatting = (text) => {
      // Processar negrito e itálico
      const parts = [];
      let remaining = text;
      let partKey = 0;
      
      while (remaining.length > 0) {
        // Negrito com **
        const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
        // Itálico com *
        const italicMatch = remaining.match(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/);
        // Código inline com `
        const codeMatch = remaining.match(/`(.+?)`/);
        
        // Encontrar o primeiro match
        const matches = [
          boldMatch ? { type: 'bold', match: boldMatch, index: remaining.indexOf(boldMatch[0]) } : null,
          italicMatch ? { type: 'italic', match: italicMatch, index: remaining.indexOf(italicMatch[0]) } : null,
          codeMatch ? { type: 'code', match: codeMatch, index: remaining.indexOf(codeMatch[0]) } : null,
        ].filter(m => m !== null).sort((a, b) => a.index - b.index);
        
        if (matches.length === 0) {
          parts.push(remaining);
          break;
        }
        
        const firstMatch = matches[0];
        
        // Adicionar texto antes do match
        if (firstMatch.index > 0) {
          parts.push(remaining.substring(0, firstMatch.index));
        }
        
        // Adicionar o elemento formatado
        if (firstMatch.type === 'bold') {
          parts.push(<strong key={partKey++}>{firstMatch.match[1]}</strong>);
          remaining = remaining.substring(firstMatch.index + firstMatch.match[0].length);
        } else if (firstMatch.type === 'italic') {
          parts.push(<em key={partKey++}>{firstMatch.match[1]}</em>);
          remaining = remaining.substring(firstMatch.index + firstMatch.match[0].length);
        } else if (firstMatch.type === 'code') {
          parts.push(<code key={partKey++}>{firstMatch.match[1]}</code>);
          remaining = remaining.substring(firstMatch.index + firstMatch.match[0].length);
        }
      }
      
      return parts.length === 1 && typeof parts[0] === 'string' ? parts[0] : parts;
    };

    const finishList = () => {
      if (currentList && listItems.length > 0) {
        const ListTag = currentList === 'ol' ? 'ol' : 'ul';
        elements.push(
          <ListTag key={key++}>
            {listItems.map((item, idx) => (
              <li key={idx}>{parseInlineFormatting(item)}</li>
            ))}
          </ListTag>
        );
        currentList = null;
        listItems = [];
      }
    };

    lines.forEach((line) => {
      const trimmedLine = line.trim();
      
      // Linha vazia
      if (trimmedLine === '') {
        finishList();
        return;
      }
      
      // Headers
      const headerMatch = trimmedLine.match(/^(#{1,6})\s+(.+)/);
      if (headerMatch) {
        finishList();
        const level = headerMatch[1].length;
        const HeaderTag = `h${level}`;
        elements.push(
          <Typography key={key++} component={HeaderTag} variant={`h${Math.min(level + 3, 6)}`} sx={{ fontWeight: 'bold', mt: 2, mb: 1 }}>
            {parseInlineFormatting(headerMatch[2])}
          </Typography>
        );
        return;
      }
      
      // Lista não ordenada
      const ulMatch = trimmedLine.match(/^[-*]\s+(.+)/);
      if (ulMatch) {
        if (currentList !== 'ul') {
          finishList();
          currentList = 'ul';
        }
        listItems.push(ulMatch[1]);
        return;
      }
      
      // Lista ordenada
      const olMatch = trimmedLine.match(/^\d+\.\s+(.+)/);
      if (olMatch) {
        if (currentList !== 'ol') {
          finishList();
          currentList = 'ol';
        }
        listItems.push(olMatch[1]);
        return;
      }
      
      // Parágrafo normal
      finishList();
      elements.push(
        <Typography key={key++} component="p" sx={{ mb: 1.5, lineHeight: 1.7 }}>
          {parseInlineFormatting(trimmedLine)}
        </Typography>
      );
    });
    
    finishList();
    return elements;
  }, [content]);

  return <>{rendered}</>;
}

/**
 * AIAnalysisCard - Card visualmente destacado para exibir análises geradas por IA
 * 
 * @component
 * @param {Object} props - Propriedades do componente
 * @param {string} [props.title='Análise de IA'] - Título do card
 * @param {string} [props.content] - Conteúdo da análise em formato Markdown
 * @param {boolean} [props.loading=false] - Estado de carregamento
 * @param {boolean} [props.collapsible=true] - Se o card pode ser colapsado
 * @param {boolean} [props.defaultExpanded=true] - Estado inicial de expansão
 * @param {Function} [props.onRefresh] - Função para recarregar a análise
 * @param {string} [props.emptyMessage='Clique em "Gerar Análise" para obter insights da IA.'] - Mensagem quando não há conteúdo
 * @param {React.ReactNode} [props.action] - Componente de ação customizado (ex: botão)
 * 
 * @example
 * <AIAnalysisCard
 *   title="Análise de Desempenho"
 *   content={analysisMarkdown}
 *   loading={isGenerating}
 *   onRefresh={handleRefresh}
 * />
 */
const AIAnalysisCard = ({
  title = 'Análise de IA',
  content,
  loading = false,
  collapsible = true,
  defaultExpanded = true,
  onRefresh,
  emptyMessage = 'Clique em "Gerar Análise" para obter insights da IA.',
  action,
}) => {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(defaultExpanded);

  const handleExpandClick = () => {
    if (collapsible) {
      setExpanded(!expanded);
    }
  };

  const hasContent = content && content.trim().length > 0;

  return (
    <StyledCard>
      <CardContent sx={{ p: 3 }}>
        <CardHeader>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconContainer>
              <AnimatedIcon loading={loading ? 'true' : 'false'} />
            </IconContainer>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'var(--mui-palette-text-primary)' }}>
                  {title}
                </Typography>
                <Chip
                  icon={<SmartToyIcon sx={{ fontSize: 14 }} />}
                  label="IA"
                  size="small"
                  color="primary"
                  variant="outlined"
                  sx={{ 
                    height: 24,
                    '& .MuiChip-label': { px: 1, fontSize: '0.7rem' },
                    '& .MuiChip-icon': { ml: 0.5 },
                  }}
                />
              </Box>
              <Typography variant="caption" sx={{ color: 'var(--mui-palette-text-secondary)' }}>
                Insights gerados por inteligência artificial
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {action}
            {onRefresh && hasContent && !loading && (
              <IconButton 
                onClick={onRefresh} 
                size="small"
                sx={{ 
                  color: 'primary.main',
                  '&:hover': { 
                    backgroundColor: alpha(theme.palette.primary.main, 0.1) 
                  } 
                }}
              >
                <RefreshIcon />
              </IconButton>
            )}
            {collapsible && hasContent && (
              <ExpandButton
                onClick={handleExpandClick}
                expanded={expanded ? 'true' : 'false'}
                size="small"
              >
                <ExpandMoreIcon />
              </ExpandButton>
            )}
          </Box>
        </CardHeader>

        <Divider sx={{ mb: 2, opacity: 0.5 }} />

        {loading ? (
          <Box sx={{ py: 2 }}>
            <Skeleton variant="text" width="80%" height={28} sx={{ mb: 1 }} />
            <Skeleton variant="text" width="100%" height={20} />
            <Skeleton variant="text" width="100%" height={20} />
            <Skeleton variant="text" width="90%" height={20} />
            <Skeleton variant="text" width="60%" height={20} sx={{ mb: 2 }} />
            <Skeleton variant="text" width="70%" height={28} sx={{ mb: 1 }} />
            <Skeleton variant="text" width="100%" height={20} />
            <Skeleton variant="text" width="85%" height={20} />
          </Box>
        ) : hasContent ? (
          <Collapse in={!collapsible || expanded} timeout="auto">
            <MarkdownContainer>
              <SimpleMarkdownRenderer content={content} />
            </MarkdownContainer>
          </Collapse>
        ) : (
          <Box 
            sx={{ 
              py: 4, 
              textAlign: 'center',
              backgroundColor: alpha(theme.palette.action.hover, 0.3),
              borderRadius: 2,
            }}
          >
            <SmartToyIcon 
              sx={{ 
                fontSize: 48, 
                color: 'text.disabled', 
                mb: 1,
                opacity: 0.5,
              }} 
            />
            <Typography variant="body2" sx={{ color: 'var(--mui-palette-text-secondary)' }}>
              {emptyMessage}
            </Typography>
          </Box>
        )}
      </CardContent>
    </StyledCard>
  );
};

export default AIAnalysisCard;
