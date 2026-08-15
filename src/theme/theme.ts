'use client'

import { createTheme } from '@mui/material/styles'
import { getPalette } from './palette'
import { tokens } from './designTokens'
import { glassSx } from './glass'

export function createAppTheme(mode: 'light' | 'dark') {
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
            backgroundColor: theme.palette.background.default,
            backgroundImage: mode === 'dark'
              ? 'radial-gradient(ellipse 80% 50% at 0% -20%, rgba(37, 99, 235, 0.14), transparent 50%), radial-gradient(ellipse 50% 40% at 100% 0%, rgba(96, 165, 250, 0.08), transparent 45%)'
              : 'radial-gradient(ellipse 80% 50% at 0% -20%, rgba(37, 99, 235, 0.08), transparent 50%), radial-gradient(ellipse 50% 40% at 100% 0%, rgba(96, 165, 250, 0.07), transparent 45%)',
            backgroundAttachment: 'fixed',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            ...glassSx(theme),
            borderRadius: 24,
            backgroundImage: glassSx(theme).backgroundImage,
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            ...glassSx(theme),
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
            backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.7)',
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
            ...glassSx(theme),
            borderRadius: 28,
          },
        },
      },
      MuiMenu: {
        styleOverrides: {
          paper: {
            ...glassSx(theme),
            borderRadius: 18,
            minWidth: 180,
          },
        },
      },
      MuiPopover: {
        styleOverrides: {
          paper: {
            ...glassSx(theme),
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
            ...glassSx(theme),
            borderRadius: 20,
            overflow: 'hidden',
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderColor: theme.palette.divider,
          },
          head: {
            fontWeight: 600,
            color: theme.palette.text.secondary,
            backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(238, 243, 250, 0.8)',
          },
        },
      },
      MuiTableRow: {
        styleOverrides: {
          root: {
            backgroundColor: mode === 'dark' ? tokens.navy : '#FFFFFF',
            transition: `background-color 300ms ${tokens.ease}`,
            '&:hover': {
              backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.04)' : '#F8FBFF',
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
