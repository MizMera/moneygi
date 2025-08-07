// src/AjouterProduitForm.jsx
import { useState } from 'react';
import { supabase } from './supabaseClient';
import { toast } from 'react-toastify';

// Importer les composants MUI
import { TextField, Button, Select, MenuItem, FormControl, InputLabel, Box, Typography } from '@mui/material';

function AjouterProduitForm({ onProduitAjoute }) {
  const [nom, setNom] = useState('');
  const [sku, setSku] = useState('');
  const [prix_vente, setPrixVente] = useState('');
  const [quantite_stock, setQuantiteStock] = useState('');
  const [type_article, setTypeArticle] = useState('Produit de Vente');

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const { data, error } = await supabase
        .from('inventaire')
        .insert([
          { nom, sku, prix_vente, quantite_stock, type_article }
        ]);
      
      if (error) throw error;
      
      toast.success('Produit ajouté avec succès !');
      setNom('');
      setSku('');
      setPrixVente('');
      setQuantiteStock('');
      setTypeArticle('Produit de Vente');

      if (onProduitAjoute) {
        onProduitAjoute();
      } 

    } catch (error) {   
      toast.error("Erreur lors de l'ajout du produit: " + error.message);
    }
  };

  return (
    // Box est une sorte de <div> de MUI, très pratique pour les styles
    <Box 
      component="form" 
      onSubmit={handleSubmit} 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: 2, 
        padding: 2, 
        border: '1px solid #ccc', 
        borderRadius: '8px',
        maxWidth: 500,
        margin: '0 auto'
      }}
    >
      <Typography variant="h6">Ajouter un Nouvel Article</Typography>
      
      <TextField 
        label="Nom du produit" 
        variant="outlined" 
        value={nom} 
        onChange={(e) => setNom(e.target.value)} 
        required 
        fullWidth
      />
      
      <TextField 
        label="SKU (Référence)" 
        variant="outlined" 
        value={sku} 
        onChange={(e) => setSku(e.target.value)} 
        fullWidth
      />
      
      <TextField 
        label="Prix de vente (€)" 
        type="number" 
        variant="outlined" 
        value={prix_vente} 
        onChange={(e) => setPrixVente(e.target.value)} 
        required 
        fullWidth
        inputProps={{ step: "0.01", min: "0" }}
      />
      
      <TextField 
        label="Quantité en stock" 
        type="number" 
        variant="outlined" 
        value={quantite_stock} 
        onChange={(e) => setQuantiteStock(e.target.value)} 
        required 
        fullWidth
        inputProps={{ min: "0" }}
      />
      
      <FormControl fullWidth>
        <InputLabel>Type d'article</InputLabel>
        <Select 
          value={type_article} 
          label="Type d'article" 
          onChange={(e) => setTypeArticle(e.target.value)}
        >
          <MenuItem value="Produit de Vente">Produit de Vente</MenuItem>
          <MenuItem value="Pièce de Réparation">Pièce de Réparation</MenuItem>
        </Select>
      </FormControl>
      
      <Button 
        type="submit" 
        variant="contained" 
        color="primary"
        size="large"
        sx={{ mt: 1 }}
      >
        Ajouter à l'inventaire
      </Button>
    </Box>
  );
}

export default AjouterProduitForm;