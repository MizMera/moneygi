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
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
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
        <ToastContainer
          position="bottom-right"
          autoClose={4000}
          hideProgressBar={false}
          closeOnClick
          pauseOnHover
        />
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>,
)