// src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

import ProtectedRoute from './ProtectedRoute.jsx';
import App from './App.jsx'
import VuePDV from './VuePDV.jsx';
import VueReparations from './VueReparations.jsx';
import DetailFiche from './DetailFiche.jsx';
import Dashboard from './Dashboard.jsx';
import CreerFiche from './CreerFiche.jsx';
import AdminSecurite from './AdminSecurite.jsx';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#6366F1' }, // Indigo
    secondary: { main: '#22C55E' }, // Green
    background: { default: '#F7F7FB', paper: '#FFFFFF' },
    text: { primary: '#0F172A', secondary: '#475569' }
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: 'Inter, Roboto, Helvetica, Arial, sans-serif',
    h1: { fontWeight: 700 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 700 },
    button: { textTransform: 'none', fontWeight: 600 }
  },
  components: {
    MuiPaper: { styleOverrides: { root: { borderRadius: 16 } } },
    MuiCard: { styleOverrides: { root: { borderRadius: 16, boxShadow: '0 8px 24px rgba(15,23,42,0.06)' } } },
    MuiButton: { styleOverrides: { root: { borderRadius: 10, paddingInline: 18, paddingBlock: 10 } } },
    MuiAppBar: { styleOverrides: { root: { boxShadow: '0 2px 8px rgba(15,23,42,0.06)' } } },
    MuiTableHead: { styleOverrides: { root: { background: '#F1F5F9' } } },
  }
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          <Route path="/*" element={<ProtectedRoute />}>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="" element={<App />} />
            <Route path="pdv" element={<VuePDV />} />
            <Route path="reparations" element={<VueReparations />} />
            <Route path="reparations/nouveau" element={<CreerFiche />} />
            <Route path="reparations/:id" element={<DetailFiche />} />
            <Route path="admin" element={<AdminSecurite />} />
          </Route>
        </Routes>
        <ToastContainer position="bottom-right" autoClose={3500} hideProgressBar theme="colored" />
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>,
)