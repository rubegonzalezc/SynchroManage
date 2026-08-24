'use client'

import { createTheme } from '@mui/material/styles'
import { getPalette } from './palette'
import { tokens, type ThemeMode } from './designTokens'
import { glassSurfaceSx } from './glass'

/**
 * Las superficies (fondos, bordes, sombras) se expresan con las variables CSS
 * de src/styles/design-system.css, no con `mode`. Así el modo oscuro ya está
 * pintado antes de que React hidrate. `mode` solo alimenta la paleta, que es
 * lo que MUI necesita para calcular contrastes y colores de texto.
 */
export function createAppTheme(mode: ThemeMode) {
  const theme = createTheme({
    palette: getPalette(mode),
    typography: {
      fontFamily: 'var(--font-plus-jakarta), "Plus Jakarta Sans", system-ui, sans-serif',
      h1: { fontWeight: 650, letterSpacing: '-0.03em' },
      h2: { fontWeight: 650, letterSpacing: '-0.02em' },
      h3: { fontWeight: 600, letterSpacing: '-0.02em' },
      button: { textTransform: 'none', fontWeight: 600 },
    },
    shape: { borderRadius: 20 },
    transitions: {
      easing: {
        easeInOut: tokens.ease,
        easeOut: tokens.ease,
        easeIn: tokens.ease,
        sharp: tokens.ease,
      },
    },
  })

  return createTheme(theme, {
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: 'var(--background)',
            backgroundImage: 'var(--body-glow)',
            backgroundAttachment: 'fixed',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            ...glassSurfaceSx,
            borderRadius: 24,
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            ...glassSurfaceSx,
            borderRadius: 24,
            overflow: 'hidden',
          },
        },
      },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: {
            borderRadius: 999,
            paddingInline: 18,
            transition: `transform 300ms ${tokens.ease}, background-color 300ms ${tokens.ease}`,
            '&:hover': { transform: 'translateY(-1px)' },
            '&:active': { transform: 'scale(0.992)' },
          },
          containedPrimary: {
            boxShadow: '0 8px 20px rgba(37, 99, 235, 0.22)',
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            transition: `transform 300ms ${tokens.ease}`,
            '&:active': { transform: 'scale(0.96)' },
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 14,
            backgroundColor: 'var(--field-bg)',
            transition: `box-shadow 300ms ${tokens.ease}`,
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: tokens.primaryLight,
            },
            '&.Mui-focused': {
              boxShadow: '0 0 0 4px rgba(37, 99, 235, 0.12)',
            },
          },
        },
      },
      MuiDialog: {
        defaultProps: {
          transitionDuration: { enter: 320, exit: 220 },
        },
        styleOverrides: {
          paper: {
            ...glassSurfaceSx,
            borderRadius: 28,
          },
        },
      },
      MuiMenu: {
        styleOverrides: {
          paper: {
            ...glassSurfaceSx,
            borderRadius: 18,
            minWidth: 180,
          },
        },
      },
      MuiPopover: {
        styleOverrides: {
          paper: {
            ...glassSurfaceSx,
            borderRadius: 18,
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 999,
            fontWeight: 600,
          },
        },
      },
      MuiTableContainer: {
        styleOverrides: {
          root: {
            ...glassSurfaceSx,
            borderRadius: 20,
            overflow: 'hidden',
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderColor: 'var(--border)',
          },
          head: {
            fontWeight: 600,
            color: 'var(--muted-foreground)',
            backgroundColor: 'var(--table-head-bg)',
          },
        },
      },
      MuiTableRow: {
        styleOverrides: {
          root: {
            backgroundColor: 'var(--table-row-bg)',
            transition: `background-color 300ms ${tokens.ease}`,
            '&:hover': {
              backgroundColor: 'var(--table-row-hover)',
            },
          },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            borderRadius: 10,
            backdropFilter: 'blur(12px)',
            fontSize: 12,
          },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            transition: `background-color 200ms ${tokens.ease}`,
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            background: 'none',
            backgroundColor: 'transparent',
            backgroundImage: 'none',
            border: 0,
            boxShadow: 'none',
            backdropFilter: 'none',
            WebkitBackdropFilter: 'none',
            borderRadius: 0,
            width: tokens.sidebarWidth,
            overflow: 'visible',
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            backgroundColor: 'transparent',
            boxShadow: 'none',
            backdropFilter: 'none',
            border: 'none',
          },
        },
      },
    },
  })
}
