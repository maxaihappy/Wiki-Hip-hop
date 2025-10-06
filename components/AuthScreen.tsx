import React, { useState } from 'react';

interface AuthScreenProps {
  onSuccess: () => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onSuccess }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isShaking, setIsShaking] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'MX') {
      setError('');
      onSuccess();
    } else {
      setError('Invalid access code. Please try again.');
      setPassword('');
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500); // Duration of the shake animation
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
      <style>{`
        @keyframes shake {
          10%, 90% { transform: translate3d(-1px, 0, 0); }
          20%, 80% { transform: translate3d(2px, 0, 0); }
          30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
          40%, 60% { transform: translate3d(4px, 0, 0); }
        }
        .animate-shake {
          animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
        }
      `}</style>
      <div className="w-full max-w-sm text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500 mb-4">
          Wiki Hip-hop
        </h1>
        <p className="text-gray-400 mb-8">Enter Access Code</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoFocus
              className={`w-full px-6 py-4 text-lg text-center text-white bg-gray-800 border-2 rounded-full outline-none transition-all duration-300 placeholder-gray-500 ${isShaking ? 'animate-shake border-red-500' : 'border-gray-700 focus:ring-4 focus:ring-purple-500/50 focus:border-purple-500'}`}
            />
          </div>
          <button
            type="submit"
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-8 rounded-full transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-purple-500/50"
          >
            Enter
          </button>
        </form>
        {error && <p className="text-red-400 mt-4 text-sm">{error}</p>}
         <footer className="text-center text-gray-600 mt-16 pb-4">
          <p>Powered by Gemini. Crafted for creators.</p>
        </footer>
      </div>
    </div>
  );
};

export default AuthScreen;
