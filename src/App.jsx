import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirestore, doc, onSnapshot, getDoc } from 'firebase/firestore';

// Component Imports
import AuthPage from './components/AuthPage.jsx';
import CreateProfilePage from './components/CreateProfilePage.jsx';
import Game from './components/Game.jsx'; 

// --- Firebase Config (from environment variables) ---
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

const appId = 'tradewars-2025-prod';
const PLAYERS_PATH = `artifacts/${appId}/public/data/tradewars_players`;
const INITIAL_CREDITS = 1000;
const INITIAL_HOLDS = 10;
const INITIAL_SHIP_HEALTH = 100;
const COMMODITIES = [
    { name: 'Gold', basePrice: 100 }, { name: 'Organics', basePrice: 20 },
    { name: 'Equipment', basePrice: 50 }, { name: 'Gemstones', basePrice: 300 },
];

export default function App() {
  const [user, setUser] = useState(null); // Stores the full auth user object or null
  const [player, setPlayer] = useState(null); // Stores the Firestore player profile
  const [isLoading, setIsLoading] = useState(true);
  const [needsProfile, setNeedsProfile] = useState(false);

  const authRef = useRef(null);
  const dbRef = useRef(null);

  useEffect(() => {
    const app = initializeApp(firebaseConfig);
    authRef.current = getAuth(app);
    dbRef.current = getFirestore(app);
    
    const unsubscribeAuth = onAuthStateChanged(authRef.current, (authUser) => {
      setUser(authUser);
      setIsLoading(false); 
    });

    return () => unsubscribeAuth();
  }, []);

  // This reactive effect listens for changes to the user's profile
  useEffect(() => {
    if (user) {
      const playerDocRef = doc(dbRef.current, PLAYERS_PATH, user.uid);
      const unsubscribePlayer = onSnapshot(playerDocRef, (doc) => {
        if (doc.exists()) {
          setPlayer(doc.data());
          setNeedsProfile(false);
        } else {
          setPlayer(null);
          setNeedsProfile(true);
        }
      });
      return () => unsubscribePlayer();
    } else {
      setPlayer(null);
      setNeedsProfile(false);
    }
  }, [user]);

  const handleSignOut = () => {
    signOut(authRef.current).catch(err => console.error("Sign out error", err));
  };

  // --- RENDER LOGIC ---
  if (isLoading) {
    return <div className="bg-gray-900 text-green-400 h-screen flex items-center justify-center font-mono text-xl animate-pulse">INITIALIZING CONNECTION...</div>;
  }

  // If a user is logged in but needs a profile, show the profile creation page.
  if (user && needsProfile) {
    return (
      <CreateProfilePage 
        user={user}
        PLAYERS_PATH={PLAYERS_PATH}
        INITIAL_CREDITS={INITIAL_CREDITS}
        INITIAL_HOLDS={INITIAL_HOLDS}
        INITIAL_SHIP_HEALTH={INITIAL_SHIP_HEALTH}
        COMMODITIES={COMMODITIES}
      />
    );
  }

  // If no user is authenticated, show the login/signup page.
  if (!user) {
    return <AuthPage />;
  }
  
  // If a user is authenticated AND has a profile, render the main Game component
  if (user && player) {
    return <Game user={user} player={player} onSignOut={handleSignOut} />;
  }

  // Fallback for the brief moment between user login and player data loading
  return <div className="bg-gray-900 text-green-400 h-screen flex items-center justify-center font-mono text-xl animate-pulse">LOADING CAPTAIN'S LOG...</div>;
}

