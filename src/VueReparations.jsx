// src/VueReparations.jsx
import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';

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

  // Fonction pour filtrer par statut
  const getStatutStyle = (statut) => {
    switch (statut) {
      case 'Reçu':
        return { backgroundColor: '#e3f2fd', color: '#1976d2' };
      case 'En cours':
        return { backgroundColor: '#fff3e0', color: '#f57c00' };
      case 'Terminé':
        return { backgroundColor: '#e8f5e8', color: '#388e3c' };
      default:
        return { backgroundColor: '#f5f5f5', color: '#666' };
    }
  };

  if (chargement) return <div>Chargement des fiches de réparation...</div>;

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Module de Réparations ({fiches.length} fiches)</h1>
        <div>
          <button 
            onClick={handleRefresh}
            style={{ marginRight: '10px', padding: '8px 16px' }}
          >
            🔄 Actualiser
          </button>
          <Link to="/reparations/nouveau">
            <button style={{ padding: '10px 20px', backgroundColor: '#1976d2', color: 'white', border: 'none', borderRadius: '4px' }}>
              + Nouvelle Fiche de Réparation
            </button>
          </Link>
        </div>
      </div>

      {fiches.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          <p>Aucune fiche de réparation trouvée.</p>
          <Link to="/reparations/nouveau">
            <button>Créer la première fiche</button>
          </Link>
        </div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <thead>
            <tr style={{ backgroundColor: '#f5f5f5' }}>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>ID</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Client</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Téléphone</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Appareil</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Problème</th>
              <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #ddd' }}>Statut</th>
              <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #ddd' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {fiches.map(fiche => (
              <tr key={fiche.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '12px' }}>#{fiche.id}</td>
                <td style={{ padding: '12px', fontWeight: 'bold' }}>
                  {fiche.clients?.nom || 'Client supprimé'}
                </td>
                <td style={{ padding: '12px' }}>
                  {fiche.clients?.telephone || 'N/A'}
                </td>
                <td style={{ padding: '12px' }}>{fiche.appareil_description}</td>
                <td style={{ padding: '12px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {fiche.probleme_signale}
                </td>
                <td style={{ padding: '12px', textAlign: 'center' }}>
                  <span 
                    style={{
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      ...getStatutStyle(fiche.statut)
                    }}
                  >
                    {fiche.statut}
                  </span>
                </td>
                <td style={{ padding: '12px', textAlign: 'center' }}>
                  <Link 
                    to={`/reparations/${fiche.id}`}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#1976d2',
                      color: 'white',
                      textDecoration: 'none',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                  >
                    📋 Voir Détails
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Indicateur de connexion temps réel */}
      <div style={{ 
        position: 'fixed', 
        bottom: '20px', 
        right: '20px', 
        padding: '8px 12px', 
        backgroundColor: '#4caf50', 
        color: 'white', 
        borderRadius: '20px',
        fontSize: '12px',
        display: 'flex',
        alignItems: 'center',
        gap: '6px'
      }}>
        <span style={{ 
          width: '8px', 
          height: '8px', 
          backgroundColor: '#fff', 
          borderRadius: '50%',
          animation: 'pulse 2s infinite'
        }}></span>
        Temps réel actif
      </div>

      <style jsx>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

export default VueReparations;