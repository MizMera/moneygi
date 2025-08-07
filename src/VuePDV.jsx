// src/VuePDV.jsx
import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { toast } from 'react-toastify';

function VuePDV() {
  const [inventaire, setInventaire] = useState([]);
  const [panier, setPanier] = useState([]);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    async function getProduitsDeVente() {
      try {
        setChargement(true);
        const { data, error } = await supabase
          .from('inventaire')
          .select('*')
          .eq('type_article', 'Produit de Vente');
        
        if (error) throw error;
        setInventaire(data || []);
      } catch (error) {
        console.error("Erreur:", error.message);
      } finally {
        setChargement(false);
      }
    }
    getProduitsDeVente();
  }, []);

  const ajouterAuPanier = (produit) => {
    setPanier(panierActuel => {
      const produitExistant = panierActuel.find(item => item.id === produit.id);
      if (produitExistant) {
        return panierActuel.map(item =>
          item.id === produit.id ? { ...item, quantite: item.quantite + 1 } : item
        );
      }
      return [...panierActuel, { ...produit, quantite: 1 }];
    });
  };

  const handleEncaisser = async () => {
    const totalVente = calculerTotal();

    if (panier.length === 0) {
      toast.error("Le panier est vide !");
      return;
    }

    try {
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          type: 'Revenu',
          source: 'Vente au Détail',
          montant: totalVente,
          description: `Vente de ${panier.length} article(s)`
        });

      if (transactionError) throw transactionError;

      const misesAJourStock = panier.map(item => {
        const nouveauStock = item.quantite_stock - item.quantite;
        return supabase
          .from('inventaire')
          .update({ quantite_stock: nouveauStock })
          .eq('id', item.id);
      });

      const { error: stockError } = await Promise.all(misesAJourStock);
      if (stockError) throw stockError;

      toast.success(`Vente de ${totalVente} € enregistrée avec succès !`);
      setPanier([]);

    } catch (error) {
      toast.error("Une erreur est survenue lors de l'encaissement: " + error.message);
    }
  };

  const calculerTotal = () => {
    return panier.reduce((total, item) => total + item.prix_vente * item.quantite, 0).toFixed(2);
  };

  if (chargement) return <div>Chargement des produits...</div>;

  return (
    <div className="pos-container">
      <div className="product-list">
        <h2>Produits Disponibles</h2>
        {inventaire.map(produit => (
          <button key={produit.id} onClick={() => ajouterAuPanier(produit)}>
            {produit.nom} ({produit.prix_vente.toFixed(2)} €)
          </button>
        ))}
      </div>
      <div className="cart-view">
        <h2>Panier Actuel</h2>
        <ul>
          {panier.map(item => (
            <li key={item.id}>
              {item.nom} (x{item.quantite}) - {(item.prix_vente * item.quantite).toFixed(2)} €
            </li>
          ))}
        </ul>
        <hr />
        <h3>Total: {calculerTotal()} €</h3>
        <button className="checkout-button" onClick={handleEncaisser}>
          Encaisser
        </button>
      </div>
    </div>
  );
}

export default VuePDV;