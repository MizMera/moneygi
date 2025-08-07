// src/CreerFiche.jsx - Component for creating new repair tickets with client and device information

// Import React hook for managing component state
import { useState } from 'react';
// Import Supabase client for database operations
import { supabase } from './supabaseClient';
// Import React Router hook for programmatic navigation
import { useNavigate } from 'react-router-dom';
// Import toast notifications for user feedback
import { toast } from 'react-toastify';

function CreerFiche() {
  // State to store the client's name input
  const [nomClient, setNomClient] = useState('');
  // State to store the client's phone number input
  const [telClient, setTelClient] = useState('');
  // State to store the device description input
  const [appareil, setAppareil] = useState('');
  // State to store the problem description input
  const [probleme, setProbleme] = useState('');
  // Hook for programmatic navigation between routes
  const navigate = useNavigate();

  // Async function to handle form submission
  const handleSubmit = async (e) => {
    // Prevent default form submission behavior (page reload)
    e.preventDefault();
    try { 
      const { data: { user } } = await supabase.auth.getUser();
      // Étape 1 : Créer le client dans la base de données
      // Step 1: Create the client in the database first
      
      const { data: clientData, error: clientError } = await supabase
        .from('clients') // Target the 'clients' table
        .insert({ nom: nomClient, telephone: telClient }) // Insert new client with name and phone
        .select() // Important: return the inserted data to get the generated ID
        .single(); // Expect only one result (the newly created client)

      // If client creation failed, throw error to be caught by catch block
      if (clientError) throw clientError;

      // Étape 2 : Utiliser l'ID du client pour créer la fiche de réparation
      // Step 2: Use the client's ID to create the repair ticket
      const { error: ficheError } = await supabase
        .from('fiches_reparation') // Target the 'fiches_reparation' table
        .insert({
          client_id: clientData.id, // Foreign key linking to the newly created client
          appareil_description: appareil, // Device description from form input
          probleme_signale: probleme, // Problem description from form input
          statut: 'Reçu', // Set initial status to 'Reçu' (Received)
          user_id: user.id 
        });
      
      // If repair ticket creation failed, throw error to be caught by catch block
      if (ficheError) throw ficheError;

      // Show success message to user
      toast.success('Nouvelle fiche de réparation créée avec succès !');
      // Redirect user to the repairs list page
      navigate('/reparations'); // Rediriger vers la liste des réparations

    } catch (error) {
      // Handle any errors from client or repair ticket creation
      toast.error("Erreur lors de la création de la fiche : " + error.message);
    }
  };

  // Render the form for creating a new repair ticket
  return (
    <form onSubmit={handleSubmit} className="fiche-form"> {/* Form with submit handler and CSS class */}
      <h2>Créer une Nouvelle Fiche de Réparation</h2> {/* Main heading */}
      
      <fieldset> {/* Group related client information fields */}
        <legend>Informations Client</legend> {/* Fieldset title */}
        {/* Input for client name - controlled component with state */}
        <input 
          type="text" 
          value={nomClient} 
          onChange={e => setNomClient(e.target.value)} 
          placeholder="Nom du client" 
          required 
        />
        {/* Input for client phone - tel type for mobile keyboards */}
        <input 
          type="tel" 
          value={telClient} 
          onChange={e => setTelClient(e.target.value)} 
          placeholder="Téléphone" 
        />
      </fieldset>
      
      <fieldset> {/* Group related device information fields */}
        <legend>Informations Appareil</legend> {/* Fieldset title */}
        {/* Input for device description - controlled component */}
        <input 
          type="text" 
          value={appareil} 
          onChange={e => setAppareil(e.target.value)} 
          placeholder="Description (ex: PC HP Pavilion G7)" 
          required 
        />
        {/* Textarea for problem description - larger input area */}
        <textarea 
          value={probleme} 
          onChange={e => setProbleme(e.target.value)} 
          placeholder="Problème signalé par le client" 
          required 
        />
      </fieldset>

      {/* Submit button to create the repair ticket */}
      <button type="submit">Enregistrer la Fiche</button>
    </form>
  );
}

// Export component for use in other files
export default CreerFiche;