// Config Firebase — ces valeurs sont PUBLIQUES par design (ce ne sont pas
// des secrets), la sécurité se fait via les règles Firestore, pas en les
// cachant. Récupère ces valeurs dans la console Firebase :
// Paramètres du projet → Général → "Vos applications" → config SDK.
const firebaseConfig = {
  apiKey: "YOUR_FIREBASE_API_KEY",           // ← remplace ici
  authDomain: "YOUR_PROJECT.firebaseapp.com", // ← remplace ici
  projectId: "YOUR_PROJECT_ID",               // ← remplace ici
  storageBucket: "YOUR_PROJECT.appspot.com",  // ← remplace ici
  messagingSenderId: "YOUR_SENDER_ID",        // ← remplace ici
  appId: "YOUR_APP_ID",                       // ← remplace ici
};
