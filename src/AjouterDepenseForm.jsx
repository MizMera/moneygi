// src/AjouterDepenseForm.jsx
import { useState } from 'react';
import { supabase } from './supabaseClient';
import { toast } from 'react-toastify';

function AjouterDepenseForm({ onDepenseAjoutee }) {
  const [montant, setMontant] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('transactions').insert({
        type: 'Dépense',
        source: 'Manuel',
        montant: parseFloat(montant),
        description
      });
      if (error) throw error;
      toast.success('Dépense enregistrée !');
      setMontant('');
      setDescription('');
      onDepenseAjoutee();
    } catch (error) {
      toast.error("Erreur : " + error.message);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h4>Enregistrer une Dépense</h4>
      <input type="number" value={montant} onChange={e => setMontant(e.target.value)} placeholder="Montant (€)" required />
      <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="Description (ex: Achat de tournevis)" required />
      <button type="submit">Ajouter Dépense</button>
    </form>
  );
}
export default AjouterDepenseForm;