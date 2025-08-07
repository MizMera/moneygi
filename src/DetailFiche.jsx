// src/DetailFiche.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import AjouterDetailFiche from './AjouterDetailFiche';
import { toast } from 'react-toastify';

function DetailFiche() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [fiche, setFiche] = useState(null);
  const [details, setDetails] = useState([]);
  const [chargement, setChargement] = useState(true);

  const handleFinaliser = async () => {
    const totalFinal = calculerTotal();
    if (totalFinal <= 0) {
      toast.error("Impossible de finaliser une facture vide.");
      return;
    }
    
    if (!window.confirm(`Confirmez-vous la facturation de ${totalFinal.toFixed(2)} € ?`)) {
      return;
    }
    
    try {
      const { error: ficheError } = await supabase
        .from('fiches_reparation')
        .update({ statut: 'Terminé' })
        .eq('id', fiche.id);
      if (ficheError) throw ficheError;

      const piecesUtilisees = details.filter(d => d.type_element === 'Pièce');
      for (const piece of piecesUtilisees) {
        if (piece.element_id) {
          const { data: inventaireActuel } = await supabase
            .from('inventaire')
            .select('quantite_stock')
            .eq('id', piece.element_id)
            .single();
          
          if (inventaireActuel) {
            const nouveauStock = inventaireActuel.quantite_stock - piece.quantite;
            await supabase
              .from('inventaire')
              .update({ quantite_stock: nouveauStock })
              .eq('id', piece.element_id);
          }
        }
      }
      
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          type: 'Revenu',
          source: 'Paiement Réparation',
          montant: totalFinal,
          description: `Facture pour fiche de réparation #${fiche.id}`
        });
      if (transactionError) throw transactionError;

      toast.success('Réparation finalisée et facturée avec succès !');
      navigate('/reparations');

    } catch (error) {
      toast.error("Erreur lors de la finalisation: " + error.message);
    }
  };

  // Fonction pour récupérer toutes les données de la fiche
  const getFicheDetails = async () => {
    try {
      setChargement(true);
      // Récupérer la fiche et les infos client
      const { data: ficheData, error: ficheError } = await supabase
        .from('fiches_reparation')
        .select('*, clients(*)')
        .eq('id', id)
        .single();
      if (ficheError) throw ficheError;
      setFiche(ficheData);

      // Récupérer les lignes de détails (pièces et main d'oeuvre)
      const { data: detailsData, error: detailsError } = await supabase
        .from('details_fiche')
        .select('*')
        .eq('fiche_id', id);
      if (detailsError) throw detailsError;
      setDetails(detailsData);

    } catch (error) {
      console.error(error.message);
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    getFicheDetails();
  }, [id]);

  const calculerTotal = () => {
    return details.reduce((total, item) => total + item.prix * item.quantite, 0);
  };

  if (chargement) return <div>Chargement...</div>;
  if (!fiche) return <div>Fiche non trouvée.</div>;

  return (
    <div>
      <h2>Détail Fiche #{fiche.id} - Statut: {fiche.statut}</h2>
      <p><strong>Client:</strong> {fiche.clients.nom} ({fiche.clients.telephone})</p>
      <p><strong>Appareil:</strong> {fiche.appareil_description}</p>
      <p><strong>Problème Signalé:</strong> {fiche.probleme_signale}</p>
      <hr />
     <div className="fiche-management">
        <div className="details-list">
      <h3>Pièces et Main d'œuvre</h3>
      <ul>
        {details.map(d => (
          <li key={d.id}>
            {d.description} (x{d.quantite}) - {d.prix.toFixed(2)} €
          </li>
        ))}
      </ul>
      <h3>Total Provisoire: {calculerTotal().toFixed(2)} €</h3>
         <div className="add-detail-container">
            <h3>Ajouter un Élément à la Fiche</h3>
          <AjouterDetailFiche ficheId={id} onDetailAjoute={getFicheDetails} />
        </div>
      </div>
      </div>
        
     <button onClick={handleFinaliser} disabled={fiche.statut === 'Terminé'}>
        {fiche.statut === 'Terminé' ? 'Déjà Facturée' : 'Finaliser et Encaisser'}
      </button>
    </div>
  );
}

export default DetailFiche;