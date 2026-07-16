// Config Firebase Web — ces valeurs sont PUBLIQUES par design (ce ne sont pas
// des secrets), la sécurité se fait via les règles Firestore, pas en les
// cachant.
//
// ⚠️ Ne colle PAS ici un JSON de service account / firebase-adminsdk avec
// `private_key`. Cette clé est réservée aux scripts serveur et ne fonctionne
// pas dans un site statique. Si elle a été partagée publiquement, régénère-la
// depuis Google Cloud IAM.
//
// Récupère plutôt la configuration SDK Web dans la console Firebase :
// Paramètres du projet → Général → "Vos applications" → app Web →
// "Configuration du SDK".
const firebaseConfig = {
  apiKey: "YOUR_FIREBASE_API_KEY",           // ← remplace ici
  authDomain: "YOUR_PROJECT.firebaseapp.com", // ← remplace ici
  projectId: "YOUR_PROJECT_ID",               // ← remplace ici
  storageBucket: "YOUR_PROJECT.appspot.com",  // ← remplace ici
  messagingSenderId: "YOUR_SENDER_ID",        // ← remplace ici
  appId: "YOUR_APP_ID",                       // ← remplace ici
};
