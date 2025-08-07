// src/App.jsx
import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { Link } from 'react-router-dom'; // Importer Link
import AjouterProduitForm from './AjouterProduitForm'; // Importer le formulaire
import './App.css';

function App() {
  const [inventaire, setInventaire] = useState([]);
  const [chargement, setChargement] = useState(true);

  // Nous extrayons la logique de récupération des données pour pouvoir l'appeler à nouveau
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

  // La fonction `onProduitAjoute` appelle simplement `getInventaire`
  const handleProduitAjoute = () => {
    getInventaire();
  };

  return (
    <div className="app-container">
       <nav>
        <Link to="/">Gestion de l'Inventaire</Link> | <Link to="/pdv">Point de Vente (PDV)</Link> | <Link to="/reparations">Réparations</Link> | <Link to="/dashboard">Tableau de Bord</Link>

      </nav>
      <hr />
      
      <AjouterProduitForm onProduitAjoute={handleProduitAjoute} />
      
      <hr />

      <h1>Gestion de l'Inventaire</h1>
      {chargement ? (
        <div>Chargement...</div>
      ) : (
        <table>
          {/* ... le reste de votre tableau ... */}
          <thead>
            <tr>
              <th>Nom</th>
              <th>SKU</th>
              <th>Stock</th>
              <th>Prix de Vente</th>
              <th>Type</th>
            </tr>
          </thead>
          <tbody>
            {inventaire.map((produit) => (
              <tr key={produit.id}>
                <td>{produit.nom}</td>
                <td>{produit.sku}</td>
                <td>{produit.quantite_stock}</td>
                <td>{produit.prix_vente.toFixed(2)} €</td>
                <td>{produit.type_article}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default App;