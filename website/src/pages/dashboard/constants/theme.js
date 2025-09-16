// src/theme.js
import { createTheme } from '@mui/material/styles';

// Define the shared properties for both light and dark themes
const sharedThemeOptions = {
  typography: {
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    h1: { fontWeight: 700, fontSize: '2.5rem' },
    h2: { fontWeight: 700, fontSize: '2rem' },
    h3: { fontWeight: 600, fontSize: '1.5rem' },
    h4: { fontWeight: 600, fontSize: '1.25rem' },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
          border: '1px solid',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
  },
};

// Define the light theme palette
export const lightTheme = createTheme({
  ...sharedThemeOptions,
  palette: {
    mode: 'light',
    primary: { main: '#007bff' },
    secondary: { main: '#6c757d' },
    background: { default: '#f8f9fa', paper: '#ffffff' },
    text: { primary: '#212529', secondary: '#6c757d' },
  },
});

// Define the dark theme palette
export const darkTheme = createTheme({
  ...sharedThemeOptions,
  palette: {
    mode: 'dark',
    primary: { main: '#0d6efd' },
    secondary: { main: '#adb5bd' },
    background: { default: '#121212', paper: '#1e1e1e' },
    text: { primary: '#e9ecef', secondary: '#adb5bd' },
    divider: 'rgba(255, 255, 255, 0.12)',
  },
});