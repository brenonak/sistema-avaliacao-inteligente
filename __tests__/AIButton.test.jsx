import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AIButton from '../src/app/components/AIButton';
import { ThemeProvider, createTheme } from '@mui/material/styles';

// Mock theme para os testes
const theme = createTheme();

const renderWithTheme = (component) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('AIButton Component', () => {
  describe('Renderização Básica', () => {
    test('deve renderizar o botão com o texto padrão', () => {
      renderWithTheme(<AIButton />);
      expect(screen.getByRole('button')).toHaveTextContent('Gerar com IA');
    });

    test('deve renderizar com label customizado', () => {
      renderWithTheme(<AIButton label="Revisar Texto" />);
      expect(screen.getByRole('button')).toHaveTextContent('Revisar Texto');
    });

    test('deve renderizar o ícone AutoAwesome', () => {
      const { container } = renderWithTheme(<AIButton />);
      const icon = container.querySelector('svg[data-testid="AutoAwesomeIcon"]');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('Props e Configurações', () => {
    test('deve aplicar variant="outlined"', () => {
      renderWithTheme(<AIButton variant="outlined" />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('MuiButton-outlined');
    });

    test('deve aplicar variant="text"', () => {
      renderWithTheme(<AIButton variant="text" />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('MuiButton-text');
    });

    test('deve aplicar diferentes tamanhos', () => {
      const { rerender } = renderWithTheme(<AIButton size="small" />);
      expect(screen.getByRole('button')).toHaveClass('MuiButton-sizeSmall');

      rerender(
        <ThemeProvider theme={theme}>
          <AIButton size="large" />
        </ThemeProvider>
      );
      expect(screen.getByRole('button')).toHaveClass('MuiButton-sizeLarge');
    });

    test('deve exibir apenas ícone quando iconOnly=true', () => {
      renderWithTheme(<AIButton iconOnly />);
      const button = screen.getByRole('button');
      expect(button).not.toHaveTextContent('Gerar com IA');
    });
  });

  describe('Estados do Botão', () => {
    test('deve exibir estado de loading', () => {
      renderWithTheme(<AIButton loading />);
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
      expect(screen.getByRole('button')).toHaveTextContent('Gerando...');
    });

    test('não deve exibir texto "Gerando..." quando iconOnly=true e loading=true', () => {
      renderWithTheme(<AIButton loading iconOnly />);
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
      expect(screen.getByRole('button')).not.toHaveTextContent('Gerando...');
    });

    test('deve estar desabilitado quando disabled=true', () => {
      renderWithTheme(<AIButton disabled />);
      expect(screen.getByRole('button')).toBeDisabled();
    });

    test('deve estar desabilitado quando loading=true', () => {
      renderWithTheme(<AIButton loading />);
      expect(screen.getByRole('button')).toBeDisabled();
    });
  });

  describe('Interações', () => {
    test('deve chamar onClick quando clicado', () => {
      const handleClick = jest.fn();
      renderWithTheme(<AIButton onClick={handleClick} />);
      
      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    test('não deve chamar onClick quando disabled', () => {
      const handleClick = jest.fn();
      renderWithTheme(<AIButton onClick={handleClick} disabled />);
      
      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).not.toHaveBeenCalled();
    });

    test('não deve chamar onClick quando loading', () => {
      const handleClick = jest.fn();
      renderWithTheme(<AIButton onClick={handleClick} loading />);
      
      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).not.toHaveBeenCalled();
    });

    test('deve funcionar sem onClick definido', () => {
      expect(() => {
        renderWithTheme(<AIButton />);
        fireEvent.click(screen.getByRole('button'));
      }).not.toThrow();
    });
  });

  describe('Tooltips', () => {
    test('deve exibir tooltip padrão', async () => {
      renderWithTheme(<AIButton />);
      const button = screen.getByRole('button');
      
      fireEvent.mouseOver(button);
      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toHaveTextContent('Gerar com IA');
      });
    });

    test('deve exibir tooltip customizado', async () => {
      renderWithTheme(<AIButton tooltipText="Revisar com IA" />);
      const button = screen.getByRole('button');
      
      fireEvent.mouseOver(button);
      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toHaveTextContent('Revisar com IA');
      });
    });

    test('deve alterar tooltip quando loading', async () => {
      renderWithTheme(<AIButton loading />);
      const button = screen.getByRole('button');
      
      fireEvent.mouseOver(button);
      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toHaveTextContent('Aguarde, processando...');
      });
    });
  });

  describe('Acessibilidade', () => {
    test('deve ter role="button"', () => {
      renderWithTheme(<AIButton />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    test('deve ser focável com teclado', () => {
      renderWithTheme(<AIButton />);
      const button = screen.getByRole('button');
      
      button.focus();
      expect(button).toHaveFocus();
    });

    test('não deve ser focável quando desabilitado', () => {
      renderWithTheme(<AIButton disabled />);
      const button = screen.getByRole('button');
      
      // Verifica que o botão tem tabindex -1 quando desabilitado
      expect(button).toHaveAttribute('tabindex', '-1');
      expect(button).toBeDisabled();
    });
  });

  describe('Props Adicionais', () => {
    test('deve aceitar props do MUI Button', () => {
      renderWithTheme(
        <AIButton 
          data-testid="custom-ai-button"
          className="custom-class"
        />
      );
      
      const button = screen.getByTestId('custom-ai-button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass('custom-class');
    });

    test('deve aceitar sx prop', () => {
      const { container } = renderWithTheme(
        <AIButton sx={{ borderRadius: 10 }} />
      );
      
      expect(container.querySelector('button')).toBeInTheDocument();
    });
  });

  describe('Integração com Formulários', () => {
    test('deve funcionar em fluxo de loading assíncrono', async () => {
      const AsyncComponent = () => {
        const [loading, setLoading] = React.useState(false);
        
        const handleClick = async () => {
          setLoading(true);
          await new Promise(resolve => setTimeout(resolve, 100));
          setLoading(false);
        };
        
        return <AIButton loading={loading} onClick={handleClick} />;
      };
      
      renderWithTheme(<AsyncComponent />);
      const button = screen.getByRole('button');
      
      // Estado inicial
      expect(button).toHaveTextContent('Gerar com IA');
      expect(button).not.toBeDisabled();
      
      // Clica e verifica loading
      fireEvent.click(button);
      await waitFor(() => {
        expect(screen.getByRole('progressbar')).toBeInTheDocument();
      });
      
      // Aguarda finalizar
      await waitFor(() => {
        expect(button).toHaveTextContent('Gerar com IA');
      }, { timeout: 200 });
    });
  });

  describe('Variantes Visuais', () => {
    test('deve aplicar estilos customizados para variant="contained"', () => {
      renderWithTheme(<AIButton variant="contained" />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('MuiButton-contained');
    });

    test('deve renderizar com diferentes cores', () => {
      renderWithTheme(<AIButton color="secondary" />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('MuiButton-colorSecondary');
    });
  });

  describe('Casos de Uso Reais', () => {
    test('deve simular geração de questão com IA', async () => {
      const mockGenerate = jest.fn(async () => {
        return new Promise(resolve => {
          setTimeout(() => resolve({ question: 'Nova questão' }), 100);
        });
      });
      
      const QuestionForm = () => {
        const [loading, setLoading] = React.useState(false);
        
        const handleGenerate = async () => {
          setLoading(true);
          await mockGenerate();
          setLoading(false);
        };
        
        return (
          <AIButton 
            loading={loading}
            onClick={handleGenerate}
            tooltipText="Gerar questão com IA"
          />
        );
      };
      
      renderWithTheme(<QuestionForm />);
      
      fireEvent.click(screen.getByRole('button'));
      
      await waitFor(() => {
        expect(screen.getByRole('progressbar')).toBeInTheDocument();
      });
      
      await waitFor(() => {
        expect(mockGenerate).toHaveBeenCalled();
      });
    });

    test('deve renderizar botão de gerar enunciado', () => {
      renderWithTheme(
        <AIButton 
          label="Gerar Enunciado"
          tooltipText="Usar IA para gerar um enunciado de questão"
          variant="outlined"
        />
      );
      
      expect(screen.getByRole('button')).toHaveTextContent('Gerar Enunciado');
    });

    test('deve renderizar botão de revisar ortografia', () => {
      renderWithTheme(
        <AIButton 
          label="Revisar Ortografia"
          tooltipText="Usar IA para revisar ortografia e gramática"
          iconOnly={false}
        />
      );
      
      expect(screen.getByRole('button')).toHaveTextContent('Revisar Ortografia');
    });

    test('deve renderizar botão de gerar distratores', () => {
      renderWithTheme(
        <AIButton 
          label="Gerar Distratores"
          tooltipText="Gerar alternativas incorretas automaticamente"
          variant="text"
        />
      );
      
      expect(screen.getByRole('button')).toHaveTextContent('Gerar Distratores');
    });
  });
});
