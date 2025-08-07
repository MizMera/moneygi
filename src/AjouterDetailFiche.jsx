// src/AjouterDetailFiche.jsx
import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { toast } from 'react-toastify';

function AjouterDetailFiche({ ficheId, onDetailAjoute }) {
  const [typeElement, setTypeElement] = useState('Pièce');
  const [piecesDisponibles, setPiecesDisponibles] = useState([]);
  
  const [pieceId, setPieceId] = useState('');
  const [description, setDescription] = useState('');
  const [quantite, setQuantite] = useState(1);
  const [prix, setPrix] = useState(0);

  useEffect(() => {
    async function chargerPieces() {
      const { data, error } = await supabase
        .from('inventaire')
        .select('*')
        .eq('type_article', 'Pièce de Réparation');
      if (error) console.error(error);
      else setPiecesDisponibles(data);
    }
    chargerPieces();
  }, []);

  useEffect(() => {
    if (typeElement === 'Pièce' && pieceId) {
      const pieceChoisie = piecesDisponibles.find(p => p.id === parseInt(pieceId));
      if (pieceChoisie) {
        setPrix(pieceChoisie.prix_vente);
        setDescription(pieceChoisie.nom);
      }
    }
  }, [pieceId, typeElement, piecesDisponibles]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!prix || !quantite || !description) {
      toast.error("Veuillez remplir tous les champs.");
      return;
    }

    try {
      const { error } = await supabase.from('details_fiche').insert({
        fiche_id: ficheId,
        type_element: typeElement,
        description: description,
        quantite: parseInt(quantite),
        prix: parseFloat(prix),
        element_id: typeElement === 'Pièce' ? pieceId : null,
      });

      if (error) throw error;
      toast.success("Élément ajouté à la fiche !");
      onDetailAjoute();
      setPieceId('');
      setDescription('');
      setQuantite(1);
      setPrix(0);
    } catch (error) {
      toast.error("Erreur : " + error.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="add-detail-form">
      <h4>Ajouter à la Facture</h4>
      <select onChange={(e) => setTypeElement(e.target.value)} value={typeElement}>
        <option value="Pièce">Pièce Détachée</option>
        <option value="Main d'œuvre">Main d'œuvre</option>
      </select>

      {typeElement === 'Pièce' ? (
        <select onChange={(e) => setPieceId(e.target.value)} value={pieceId} required>
          <option value="">-- Choisir une pièce --</option>
          {piecesDisponibles.map(p => (
            <option key={p.id} value={p.id}>{p.nom} (Stock: {p.quantite_stock})</option>
          ))}
        </select>
      ) : (
        <input type="text" placeholder="Description (ex: Installation Windows)" value={description} onChange={e => setDescription(e.target.value)} required />
      )}
      
      <input type="number" placeholder="Quantité" value={quantite} onChange={e => setQuantite(e.target.value)} required />
      <input type="number" step="0.01" placeholder="Prix Unitaire (€)" value={prix} onChange={e => setPrix(e.target.value)} required />

      <button type="submit">+ Ajouter</button>
    </form>
  );
}

export default AjouterDetailFiche;