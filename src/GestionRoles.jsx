// src/GestionRoles.jsx
import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { toast } from 'react-toastify';
import { Select, MenuItem, FormControl, InputLabel, Box, Typography, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';

function GestionRoles() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    // Note: Pour que cela marche, un admin doit avoir le droit de lire la table user_profiles
    supabase.from('user_profiles').select('*').then(({ data }) => setUsers(data || []));
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    const { error } = await supabase.from('user_profiles').update({ role: newRole }).eq('id', userId);
    if (error) {
      toast.error("Erreur de mise à jour: " + error.message);
    } else {
      toast.success("Rôle mis à jour !");
    }
  };

  return (
    <Box>
      <Typography variant="h6">Gérer les Rôles des Utilisateurs</Typography>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>ID Utilisateur</TableCell>
            <TableCell>Rôle</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {users.map(user => (
            <TableRow key={user.id}>
              <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{user.id}</TableCell>
              <TableCell>
                <FormControl size="small">
                  <Select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                  >
                    <MenuItem value="visiteur">Visiteur</MenuItem>
                    <MenuItem value="technicien">Technicien</MenuItem>
                    <MenuItem value="admin">Admin</MenuItem>
                  </Select>
                </FormControl>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
}
export default GestionRoles;