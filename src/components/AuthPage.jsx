import React, { useState } from 'react';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';

export default function AuthPage() {
  const [view, setView] = useState('signUp'); // 'signUp', 'signIn'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const auth = getAuth();

  const handleAuth = async (e, authAction) => {
    e.preventDefault();
    setError('');
    try {
      await authAction(auth, email, password);
      // onAuthStateChanged in App.jsx will handle all further logic
    } catch (err) {
      setError(err.message);
    }
  };

  const handleGoogleAuth = async () => {
    setError('');
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      // onAuthStateChanged in App.jsx will handle all further logic
    } catch (err) {
      setError(err.message);
    }
  };
  
  if (view === 'signIn') {
    return (
        <div className="bg-gray-900 min-h-screen flex items-center justify-center font-mono p-4">
            <div className="w-full max-w-md bg-black border-2 border-cyan-400 p-8 shadow-[0_0_15px_cyan]">
                <h1 className="text-3xl text-cyan-400 text-center tracking-widest mb-6">Captain Sign In</h1>
                <form onSubmit={(e) => handleAuth(e, signInWithEmailAndPassword)}>
                    <div className="mb-4"> <label className="block text-cyan-300 mb-1" htmlFor="email">Email</label> <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-gray-800 text-green-400 border border-green-700 p-2 focus:outline-none focus:border-green-400" autoComplete="email" required /> </div>
                    <div className="mb-6"> <label className="block text-cyan-300 mb-1" htmlFor="password">Password</label> <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-gray-800 text-green-400 border border-green-700 p-2 focus:outline-none focus:border-green-400" autoComplete="current-password" required /> </div>
                    {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
                    <button type="submit" className="w-full bg-green-700 text-white font-bold p-3 hover:bg-green-600 tracking-wider">Sign In with Email</button>
                </form>
                <div className="my-6 flex items-center">
                    <div className="flex-grow border-t border-cyan-700"></div><span className="flex-shrink mx-4 text-cyan-400">OR</span><div className="flex-grow border-t border-cyan-700"></div>
                </div>
                <button onClick={handleGoogleAuth} className="w-full bg-gray-700 text-white font-bold p-3 hover:bg-gray-600 flex items-center justify-center">
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"></path><path fill="#FF3D00" d="m6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z"></path><path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"></path><path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C42.012 36.49 44 30.823 44 24c0-1.341-.138-2.65-.389-3.917z"></path></svg>
                    Sign In with Google
                </button>
                <p className="text-center text-cyan-300 mt-6">Need to create a profile? <button onClick={() => { setView('signUp'); setError(''); }} className="text-green-400 hover:text-green-300 ml-2 font-bold">Sign Up</button></p>
            </div>
        </div>
    );
  }

  // Default view is 'signUp'
  return (
    <div className="bg-gray-900 min-h-screen flex items-center justify-center font-mono p-4">
      <div className="w-full max-w-md bg-black border-2 border-cyan-400 p-8 shadow-[0_0_15px_cyan]">
        <h1 className="text-3xl text-cyan-400 text-center tracking-widest mb-6">Trade Wars 2025</h1>
        <p className="text-center text-cyan-300 mb-6">Create a new captain profile to begin.</p>
        <form onSubmit={(e) => handleAuth(e, createUserWithEmailAndPassword)}>
          <div className="mb-4"> <label className="block text-cyan-300 mb-1" htmlFor="email">Email</label> <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-gray-800 text-green-400 border border-green-700 p-2 focus:outline-none focus:border-green-400" autoComplete="email" required /> </div>
          <div className="mb-6"> <label className="block text-cyan-300 mb-1" htmlFor="password">Password</label> <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-gray-800 text-green-400 border border-green-700 p-2 focus:outline-none focus:border-green-400" autoComplete="new-password" required /> </div>
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          <button type="submit" className="w-full bg-green-700 text-white font-bold p-3 hover:bg-green-600 tracking-wider">Sign Up with Email</button>
        </form>
        <div className="my-6 flex items-center">
            <div className="flex-grow border-t border-cyan-700"></div><span className="flex-shrink mx-4 text-cyan-400">OR</span><div className="flex-grow border-t border-cyan-700"></div>
        </div>
        <button onClick={handleGoogleAuth} className="w-full bg-gray-700 text-white font-bold p-3 hover:bg-gray-600 flex items-center justify-center">
            <svg className="w-5 h-5 mr-2" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"></path><path fill="#FF3D00" d="m6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z"></path><path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"></path><path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C42.012 36.49 44 30.823 44 24c0-1.341-.138-2.65-.389-3.917z"></path></svg>
            Sign Up with Google
        </button>
        <p className="text-center text-cyan-300 mt-6">Already have a profile? <button onClick={() => { setView('signIn'); setError(''); }} className="text-green-400 hover:text-green-300 ml-2 font-bold">Sign In</button></p>
      </div>
    </div>
  );
}
