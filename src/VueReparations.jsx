// src/VueReparations.jsx
import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Box, Typography, Paper, Button, Table, TableHead, TableRow, TableCell, TableBody, Stack, Chip } from '@mui/material';

function VueReparations() {
  const [fiches, setFiches] = useState([]);
  const [chargement, setChargement] = useState(true);

  // Fonction pour récupérer les fiches (réutilisable)
  const getFiches = async () => {
    try {
      setChargement(true);
      const { data, error } = await supabase
        .from('fiches_reparation')
        .select(`
          *,
          clients ( nom, telephone )
        `)
        .order('created_at', { ascending: false }); // Trier par date de création
      
      if (error) throw error;
      setFiches(data || []);
    } catch (error) {
      console.error("Erreur:", error.message);
      toast.error("Erreur lors du chargement des fiches");
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    // Chargement initial
    getFiches();

    // Configuration de l'écoute en temps réel
    const channel = supabase
      .channel('fiches_reparation_changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Écouter tous les événements (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'fiches_reparation'
        },
        (payload) => {
          console.log('Changement détecté:', payload);
          
          switch (payload.eventType) {
            case 'INSERT':
              // Nouvelle fiche créée
              toast.info('Nouvelle fiche de réparation créée');
              getFiches(); // Recharger pour avoir les données complètes avec client  
              break;
              
            case 'UPDATE':
              // Fiche mise à jour
              setFiches(currentFiches => 
                currentFiches.map(fiche => 
                  fiche.id === payload.new.id 
                    ? { ...fiche, ...payload.new }
                    : fiche
                )
              );
              toast.info(`Fiche #${payload.new.id} mise à jour`);
              break;
              
            case 'DELETE':
              // Fiche supprimée
              setFiches(currentFiches => 
                currentFiches.filter(fiche => fiche.id !== payload.old.id)
              );
              toast.info(`Fiche #${payload.old.id} supprimée`);
              break;
              
            default:
              break;
          }
        }
      )
      .subscribe();

    // Nettoyage de la souscription au démontage du composant
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Fonction pour rafraîchir manuellement
  const handleRefresh = () => {
    toast.info('Actualisation en cours...');
    getFiches();
  };

  const statutChip = (statut) => {
    const map = {
      'Reçu': { color: 'info', label: 'Reçu' },
      'En cours': { color: 'warning', label: 'En cours' },
      'Terminé': { color: 'success', label: 'Terminé' },
    };
    const cfg = map[statut] || { color: 'default', label: statut };
    return <Chip size="small" color={cfg.color} label={cfg.label} variant={cfg.color === 'default' ? 'outlined' : 'filled'} />;
  };

  if (chargement) return <div>Chargement des fiches de réparation...</div>;

  return (
    <Box className="container">
      <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'center' }} justifyContent="space-between" sx={{ mb: 3, gap: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 800 }}>Réparations</Typography>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" onClick={getFiches}>Actualiser</Button>
          <Button component={Link} to="/reparations/nouveau" variant="contained">+ Nouvelle Fiche</Button>
        </Stack>
      </Stack>

      <Paper sx={{ p: 2, boxShadow: '0 8px 24px rgba(15,23,42,0.06)' }}>
        {chargement ? (
          <Typography>Chargement des fiches de réparation...</Typography>
        ) : fiches.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
            <Typography>Aucune fiche de réparation trouvée.</Typography>
            <Button component={Link} to="/reparations/nouveau" sx={{ mt: 2 }} variant="contained">Créer la première fiche</Button>
          </Box>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Client</TableCell>
                <TableCell>Téléphone</TableCell>
                <TableCell>Appareil</TableCell>
                <TableCell>Problème</TableCell>
                <TableCell align="center">Statut</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {fiches.map((fiche) => (
                <TableRow key={fiche.id} hover>
                  <TableCell>#{fiche.id}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{fiche.clients?.nom || 'Client supprimé'}</TableCell>
                  <TableCell>{fiche.clients?.telephone || 'N/A'}</TableCell>
                  <TableCell>{fiche.appareil_description}</TableCell>
                  <TableCell sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fiche.probleme_signale}</TableCell>
                  <TableCell align="center">{statutChip(fiche.statut)}</TableCell>
                  <TableCell align="center">
                    <Button size="small" component={Link} to={`/reparations/${fiche.id}`} variant="contained">
                      Voir Détails
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Paper>
    </Box>
  );
}

export default VueReparations;