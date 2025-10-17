import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Pencil, PenTool, Eraser, Palette, Ruler, Sparkles, Edit3, Compass, Paintbrush } from 'lucide-react';

type AuthMode = 'login' | 'signup';

export const AuthPage = () => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const { signIn, signUp } = useAuth();

  useEffect(() => {
    // Set pencil cursor
    const style = document.createElement('style');
    style.innerHTML = `
      * {
        cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="%23f97316" stroke-width="2.5"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>') 2 18, auto !important;
      }
      button, input {
        cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="%23f97316" stroke-width="2.5"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>') 2 18, pointer !important;
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  const validateForm = () => {
    if (mode === 'signup' && !username.trim()) {
      setError('Username is required');
      return false;
    }
    if (!email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Invalid email format');
      return false;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) return;

    setLoading(true);
    try {
      if (mode === 'login') {
        await signIn(email, password);
      } else {
        await signUp(email, password, username);
        // Switch to login mode after successful signup
        setMode('login');
        setError('');
        setPassword('');
      }
    } catch (err) {
      if (err instanceof Error) setError(err.message);
      else setError('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-white">
      {/* Whiteboard Border Frame */}
      <div className="absolute inset-0 border-[24px] border-gray-800 shadow-2xl">
        <div className="absolute inset-0 border-4 border-gray-600"></div>
      </div>

      {/* Light Orange Watercolor Texture Background */}
      <div className="absolute inset-[28px]" style={{
        background: `
          radial-gradient(circle at 20% 30%, rgba(255, 237, 213, 0.6) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(254, 215, 170, 0.5) 0%, transparent 50%),
          radial-gradient(circle at 40% 70%, rgba(253, 230, 206, 0.6) 0%, transparent 50%),
          radial-gradient(circle at 90% 80%, rgba(255, 224, 189, 0.5) 0%, transparent 50%),
          radial-gradient(circle at 10% 90%, rgba(254, 240, 220, 0.4) 0%, transparent 50%),
          linear-gradient(135deg, #fff5eb 0%, #fef3e7 25%, #fffaf5 50%, #fef5ed 75%, #fff8f0 100%)
        `,
      }}></div>

      {/* Subtle Paper Texture Overlay */}
      <div className="absolute inset-[28px] opacity-[0.03]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='0.5'/%3E%3C/svg%3E")`,
      }}></div>

      {/* Corner Decorative Drawing Accessories */}
      
      {/* Top Left Corner - Pencils & Ruler */}
      <div className="absolute top-12 left-12 z-10">
        <div className="relative">
          <Pencil className="w-28 h-28 text-orange-400 transform -rotate-45 drop-shadow-lg" strokeWidth={1.8} />
          <Ruler className="w-24 h-24 text-amber-500 absolute -bottom-6 -right-6 transform rotate-12 drop-shadow-md" strokeWidth={1.8} />
        </div>
      </div>

      {/* Top Right Corner - Palette & Paintbrush */}
      <div className="absolute top-12 right-12 z-10">
        <div className="relative">
          <Palette className="w-28 h-28 text-rose-400 transform rotate-12 drop-shadow-lg" strokeWidth={1.8} />
          <Paintbrush className="w-20 h-20 text-purple-400 absolute -bottom-4 -left-6 transform -rotate-45 drop-shadow-md" strokeWidth={1.8} />
        </div>
      </div>

      {/* Bottom Left Corner - Compass & Eraser */}
      <div className="absolute bottom-12 left-12 z-10">
        <div className="relative">
          <Compass className="w-28 h-28 text-blue-400 transform rotate-45 drop-shadow-lg" strokeWidth={1.8} />
          <Eraser className="w-20 h-20 text-pink-400 absolute -top-4 -right-6 transform -rotate-12 drop-shadow-md" strokeWidth={1.8} />
        </div>
      </div>

      {/* Bottom Right Corner - Pen Tools & Edit */}
      <div className="absolute bottom-12 right-12 z-10">
        <div className="relative">
          <PenTool className="w-28 h-28 text-indigo-400 transform -rotate-30 drop-shadow-lg" strokeWidth={1.8} />
          <Edit3 className="w-22 h-22 text-cyan-400 absolute -top-6 -left-6 transform rotate-45 drop-shadow-md" strokeWidth={1.8} />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="relative min-h-screen flex items-center justify-center p-8 py-16 z-20">
        <div className="w-full max-w-xl">
          
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-6">
              {/* <div className="relative">
                <Pencil className="w-16 h-16 text-orange-500 transform -rotate-12 drop-shadow-xl" strokeWidth={2.5} />
                <Sparkles className="w-8 h-8 text-amber-400 absolute -top-2 -right-2 animate-pulse drop-shadow-lg" strokeWidth={2.5} />
              </div> */}
              <h1 
                className="text-7xl font-bold text-gray-800 ml-5 tracking-tight drop-shadow-sm"
                style={{ fontFamily: "'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}
              >
                XLR8
              </h1>
            </div>
            <p 
              className="text-gray-700 text-2xl font-medium tracking-wide"
              style={{ fontFamily: "'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}
            >
              Sketch your ideas, collaborate in real-time
            </p>
          </div>

          {/* Login Box - Whiteboard Style */}
          <div 
            className="bg-white rounded-3xl p-12 relative border-8 border-gray-700 shadow-2xl"
            style={{
              boxShadow: '0 30px 60px -15px rgba(0, 0, 0, 0.3), inset 0 2px 8px 0 rgba(255, 255, 255, 0.7)',
            }}
          >
            {/* Whiteboard Corner Mounts */}
            <div className="absolute -top-4 -left-4 w-8 h-8 bg-gray-800 rounded-full shadow-xl border-2 border-gray-600"></div>
            <div className="absolute -top-4 -right-4 w-8 h-8 bg-gray-800 rounded-full shadow-xl border-2 border-gray-600"></div>
            <div className="absolute -bottom-4 -left-4 w-8 h-8 bg-gray-800 rounded-full shadow-xl border-2 border-gray-600"></div>
            <div className="absolute -bottom-4 -right-4 w-8 h-8 bg-gray-800 rounded-full shadow-xl border-2 border-gray-600"></div>

            {/* Mode Toggle Buttons */}
            <div className="flex mb-10 bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl p-2.5 border-2 border-orange-200/60 shadow-inner relative z-10">
              <button
                type="button"
                onClick={() => { setMode('login'); setError(''); }}
                className={`flex-1 py-4 px-8 rounded-xl font-bold text-2xl transition-all duration-300 ${
                  mode === 'login' 
                    ? 'bg-white text-orange-600 shadow-xl transform scale-105 border-2 border-orange-300' 
                    : 'text-gray-600 hover:text-gray-800 hover:bg-white/60'
                }`}
                style={{ fontFamily: "'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => { setMode('signup'); setError(''); }}
                className={`flex-1 py-4 px-8 rounded-xl font-bold text-2xl transition-all duration-300 ${
                  mode === 'signup' 
                    ? 'bg-white text-orange-600 shadow-xl transform scale-105 border-2 border-orange-300' 
                    : 'text-gray-600 hover:text-gray-800 hover:bg-white/60'
                }`}
                style={{ fontFamily: "'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}
              >
                Sign Up
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-7 relative z-10">
              
              {/* Username Field (Signup Only) */}
              {mode === 'signup' && (
                <div className="relative">
                  <label 
                    className="block text-lg font-bold text-gray-800 mb-3"
                    style={{ fontFamily: "'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}
                  >
                    Username
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onFocus={() => setFocusedField('username')}
                    onBlur={() => setFocusedField(null)}
                    className={`w-full px-6 py-5 rounded-xl border-3 bg-orange-50/30 text-gray-900 text-lg font-medium transition-all duration-300 outline-none ${
                      focusedField === 'username' 
                        ? 'border-orange-500 bg-white shadow-xl ring-4 ring-orange-200/50 transform scale-[1.02]' 
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    placeholder="Your creative name"
                    style={{ fontFamily: "'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}
                  />
                </div>
              )}

              {/* Email Field */}
              <div className="relative">
                <label 
                  className="block text-lg font-bold text-gray-800 mb-3"
                  style={{ fontFamily: "'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}
                >
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  className={`w-full px-6 py-5 rounded-xl border-3 bg-orange-50/30 text-gray-900 text-lg font-medium transition-all duration-300 outline-none ${
                    focusedField === 'email' 
                      ? 'border-orange-500 bg-white shadow-xl ring-4 ring-orange-200/50 transform scale-[1.02]' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  placeholder="your@email.com"
                  style={{ fontFamily: "'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}
                />
              </div>

              {/* Password Field */}
              <div className="relative">
                <label 
                  className="block text-lg font-bold text-gray-800 mb-3"
                  style={{ fontFamily: "'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}
                >
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  className={`w-full px-6 py-5 rounded-xl border-3 bg-orange-50/30 text-gray-900 text-lg font-medium transition-all duration-300 outline-none ${
                    focusedField === 'password' 
                      ? 'border-orange-500 bg-white shadow-xl ring-4 ring-orange-200/50 transform scale-[1.02]' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  placeholder="••••••••"
                  style={{ fontFamily: "'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}
                />
              </div>

              {/* Error Message */}
              {error && (
                <div 
                  className="bg-red-50 border-3 border-red-300 rounded-xl p-4 text-red-700 font-semibold text-base shadow-md"
                  style={{ fontFamily: "'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}
                >
                  {error}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-orange-500 via-orange-600 to-amber-600 text-white py-5 rounded-xl font-bold text-xl shadow-2xl hover:shadow-3xl hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed border-2 border-orange-700/50 mt-8"
                style={{ fontFamily: "'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : (
                  mode === 'login' ? 'Start Creating' : 'Join the Canvas'
                )}
              </button>
            </form>

            {/* Footer Text */}
            <div className="mt-8 pt-6 border-t-2 border-gray-200 text-center">
              <p 
                className="text-sm text-gray-600 font-semibold tracking-wide"
                style={{ fontFamily: "'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}
              >
                Draw. Collaborate. Create Magic.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
