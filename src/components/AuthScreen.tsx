
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Eye, EyeOff, User, Lock } from 'lucide-react';

interface AuthScreenProps {
  onLogin: () => void;
}

const AuthScreen = ({ onLogin }: AuthScreenProps) => {
  const [isLogin, setIsLogin] = useState(true);
  const [isUserType, setIsUserType] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [specialty, setSpecialty] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-32 h-32 bg-orange-400 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-red-500 rounded-full opacity-30 animate-bounce"></div>
        <div className="absolute bottom-32 left-1/4 w-20 h-20 bg-yellow-400 rounded-full opacity-25 animate-pulse"></div>
        <div className="absolute bottom-20 right-1/3 w-16 h-16 bg-blue-400 rounded-full opacity-20 animate-bounce"></div>
        <div className="absolute top-1/2 left-1/2 w-40 h-40 bg-purple-500 rounded-full opacity-10 animate-ping"></div>
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen p-6">
        <div className="w-full max-w-md space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold text-white">
              {isLogin ? 'AUTHORIZATION' : 'CREATE A NEW'}
            </h1>
            <h1 className="text-4xl font-bold">
              <span className="text-white">OF YOUR </span>
              <span className="text-red-500">ACCOUNT</span>
            </h1>
          </div>

          {/* User Type Toggle */}
          <div className="flex items-center justify-center space-x-8">
            <span className="text-white text-lg">User</span>
            <div 
              className="relative w-16 h-8 bg-red-500 rounded-full cursor-pointer transition-all duration-300"
              onClick={() => setIsUserType(!isUserType)}
            >
              <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform duration-300 ${isUserType ? 'left-1' : 'left-9'}`}></div>
            </div>
            <span className="text-white text-lg">Professional</span>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative">
              <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-12 py-4 bg-white/10 border-white/20 text-white placeholder-gray-300 rounded-xl backdrop-blur-sm"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder={isLogin ? "Password" : "Create a Password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-12 pr-12 py-4 bg-white/10 border-white/20 text-white placeholder-gray-300 rounded-xl backdrop-blur-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {!isLogin && (
              <div className="relative">
                <select
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  className="w-full pl-4 pr-12 py-4 bg-white/10 border border-white/20 text-white rounded-xl backdrop-blur-sm appearance-none"
                >
                  <option value="" className="text-gray-900">Select your speciality</option>
                  <option value="producer" className="text-gray-900">Producer</option>
                  <option value="director" className="text-gray-900">Director</option>
                  <option value="editor" className="text-gray-900">Editor</option>
                  <option value="camera-operator" className="text-gray-900">Camera Operator</option>
                  <option value="photographer" className="text-gray-900">Photographer</option>
                </select>
              </div>
            )}

            {isLogin && (
              <div className="text-left">
                <button type="button" className="text-white/60 text-sm">
                  Forgot password?
                </button>
              </div>
            )}

            {isLogin && (
              <div className="flex items-start space-x-3">
                <input type="checkbox" className="mt-1" />
                <p className="text-white/60 text-sm">
                  By submitting this information, I agree with the{' '}
                  <span className="text-white underline">Privacy policy</span> and{' '}
                  <span className="text-white underline">Terms of use</span>
                </p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full py-4 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-colors"
            >
              {isLogin ? 'Log In' : 'Create Account'}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => setIsLogin(!isLogin)}
              className="w-full py-4 border-white/30 text-white bg-transparent hover:bg-white/10 rounded-xl transition-colors"
            >
              {isLogin ? 'Registration' : 'Back to Login'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;
