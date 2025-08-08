// src/App.jsx
import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import AjouterProduitForm from './AjouterProduitForm';
import './App.css';
import { Box, Paper, Typography, Table, TableHead, TableRow, TableCell, TableBody } from '@mui/material';

function App() {
  const [inventaire, setInventaire] = useState([]);
  const [chargement, setChargement] = useState(true);

  const getInventaire = async () => {
    try {
      setChargement(true);
      let { data, error } = await supabase.from('inventaire').select('*');
      if (error) throw error;
      if (data) setInventaire(data);
    } catch (error) {
      console.error("Erreur lors de la récupération de l'inventaire:", error.message);
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    getInventaire();
  }, []);

  const handleProduitAjoute = () => {
    getInventaire();
  };

  return (
    <Box className="container">
      <Typography variant="h4" sx={{ fontWeight: 800, mb: 3 }}>Gestion de l'Inventaire</Typography>

      <Box sx={{ mb: 3 }}>
        <AjouterProduitForm onProduitAjoute={handleProduitAjoute} />
      </Box>

      <Paper sx={{ p: 2, boxShadow: '0 8px 24px rgba(15,23,42,0.06)' }}>
        {chargement ? (
          <Typography>Chargement...</Typography>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nom</TableCell>
                <TableCell>SKU</TableCell>
                <TableCell>Stock</TableCell>
                <TableCell>Prix de Vente</TableCell>
                <TableCell>Type</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {inventaire.map((produit) => (
                <TableRow key={produit.id} hover>
                  <TableCell>{produit.nom}</TableCell>
                  <TableCell>{produit.sku || '—'}</TableCell>
                  <TableCell>{produit.quantite_stock}</TableCell>
                  <TableCell>{Number(produit.prix_vente || 0).toFixed(2)} €</TableCell>
                  <TableCell>{produit.type_article}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Paper>
    </Box>
  );
}

export default App;