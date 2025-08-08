// src/GestionRoles.jsx
import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { toast } from 'react-toastify';
import { Select, MenuItem, FormControl, InputLabel, Box, Typography, Table, TableBody, TableCell, TableHead, TableRow, CircularProgress, Paper } from '@mui/material';

function GestionRoles() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      // 1) Essayer de récupérer via la RPC sécurisée si disponible
      const { data: rpcData, error: rpcError } = await supabase.rpc('admin_list_users');
      if (!rpcError && rpcData) {
        setUsers(rpcData);
        return;
      }
      // 2) Sinon, repli vers la table user_profiles (infos limitées)
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, email, role')
        .order('email', { ascending: true });
      if (error) throw error;
      // Normaliser le format pour le tableau
      const normalized = (data || []).map(u => ({
        id: u.id,
        email: u.email,
        role: u.role,
        created_at: null,
        last_sign_in_at: null,
      }));
      setUsers(normalized);
      if (rpcError) {
        console.warn('admin_list_users RPC non trouvée. Utilisation du repli user_profiles.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors du chargement des utilisateurs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    // Optimistic UI update
    setUsers(prev => prev.map(u => (u.id === userId ? { ...u, role: newRole } : u)));
    const { error } = await supabase.from('user_profiles').update({ role: newRole }).eq('id', userId);
    if (error) {
      toast.error('Erreur de mise à jour: ' + error.message);
      // Pas de revert facile ici car on ne stocke pas l'ancien rôle; rafraîchir
      fetchUsers();
    } else {
      toast.success('Rôle mis à jour !');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>Gérer les Utilisateurs</Typography>
      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Email</TableCell>
              <TableCell>ID Utilisateur</TableCell>
              <TableCell>Créé le</TableCell>
              <TableCell>Dernière connexion</TableCell>
              <TableCell>Rôle</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">Aucun utilisateur</TableCell>
              </TableRow>
            ) : (
              users.map(user => (
                <TableRow key={user.id}>
                  <TableCell>{user.email || '—'}</TableCell>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{user.id}</TableCell>
                  <TableCell>{user.created_at ? new Date(user.created_at).toLocaleString('fr-FR') : '—'}</TableCell>
                  <TableCell>{user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString('fr-FR') : '—'}</TableCell>
                  <TableCell>
                    <FormControl size="small" sx={{ minWidth: 140 }}>
                      <InputLabel id={`role-label-${user.id}`}>Rôle</InputLabel>
                      <Select
                        labelId={`role-label-${user.id}`}
                        label="Rôle"
                        value={user.role || 'visiteur'}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      >
                        <MenuItem value="visiteur">Visiteur</MenuItem>
                        <MenuItem value="technicien">Technicien</MenuItem>
                        <MenuItem value="admin">Admin</MenuItem>
                      </Select>
                    </FormControl>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}
export default GestionRoles;