// src/AdminSecurite.jsx
import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { Typography, Box, CircularProgress, Paper, Divider } from '@mui/material';

// Nous allons créer ces composants juste après
import GestionInvitations from './GestionInvitations';
import GestionRoles from './GestionRoles';
import StatutUtilisateurActuel from './StatutUtilisateurActuel';

function AdminSecurite() {
  const [loading, setLoading] = useState(true);
  const [profil, setProfil] = useState(null);

  useEffect(() => {
    async function getProfile() {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        
        if (error) console.error("Erreur de profil:", error);
        setProfil(data);
      }
      setLoading(false);
    }
    getProfile();
  }, []);

  if (loading) {
    return <CircularProgress />;
  }

  return (
    <Box sx={{ padding: 3 }}>
      <Typography variant="h4" gutterBottom>
        Administration & Sécurité
      </Typography>

      {/* SECTION VISIBLE PAR TOUS */}
      <StatutUtilisateurActuel />
      <Divider sx={{ marginY: 4 }} />

      {/* SECTION VISIBLE UNIQUEMENT PAR LES ADMINS */}
      {profil?.role === 'admin' ? (
        <Paper elevation={3} sx={{ padding: 2 }}>
          <Typography variant="h5" color="secondary" gutterBottom>
            Panneau d'Administration
          </Typography>
          <GestionInvitations />
          <Divider sx={{ marginY: 3 }} />
          <GestionRoles />
        </Paper>
      ) : (
        <Typography>Vous n'avez pas les droits nécessaires pour accéder au panneau d'administration.</Typography>
      )}
    </Box>
  );
}

export default AdminSecurite;