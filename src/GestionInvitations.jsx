// src/GestionInvitations.jsx
import { useState } from 'react';
import { supabase } from './supabaseClient';
import { toast } from 'react-toastify';
import { TextField, Button, Box, Typography } from '@mui/material';

function GestionInvitations() {
  const [email, setEmail] = useState('');

  const handleInvite = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('invitations').insert({ email: email });
    if (error) {
      toast.error('Erreur lors de l\'invitation: ' + error.message);
    } else {
      toast.success(`${email} a été invité avec succès !`);
      setEmail('');
    }
  };

  return (
    <Box component="form" onSubmit={handleInvite}>
      <Typography variant="h6">Inviter un Nouvel Utilisateur</Typography>
      <TextField
        type="email"
        label="Email de l'utilisateur à inviter"
        value={email}
        onChange={e => setEmail(e.target.value)}
        required
        fullWidth
        sx={{ marginY: 1 }}
      />
      <Button type="submit" variant="contained">Inviter</Button>
    </Box>
  );
}
export default GestionInvitations;