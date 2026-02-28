import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Activity, Mail, Lock, User, AlertCircle, Check } from 'lucide-react';

export const RegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const passwordRequirements = [
    { met: password.length >= 8, text: 'At least 8 characters' },
    { met: /[A-Z]/.test(password), text: 'One uppercase letter' },
    { met: /[0-9]/.test(password), text: 'One number' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setIsLoading(true);

    const result = await register(name, email, password);
    
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 auth-pattern relative overflow-hidden">
        <div className="absolute inset-0 noise-overlay" />
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-sage-500 flex items-center justify-center">
              <Activity className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-heading font-bold text-slate-900">PMR Atlas</span>
          </div>
          
          <h1 className="text-4xl xl:text-5xl font-heading font-bold text-slate-900 leading-tight mb-6">
            Start Your<br />
            <span className="text-sage-600">Medical Education</span> Journey
          </h1>
          
          <p className="text-lg text-slate-600 leading-relaxed max-w-md">
            Join thousands of medical students and practitioners who use PMR Atlas 
            as their go-to reference for physical medicine and rehabilitation.
          </p>
          
          <div className="mt-12 space-y-4">
            <div className="flex items-center gap-3 text-slate-700">
              <div className="w-8 h-8 rounded-lg bg-sage-100 flex items-center justify-center">
                <Check className="w-4 h-4 text-sage-600" />
              </div>
              <span>Comprehensive disease database</span>
            </div>
            <div className="flex items-center gap-3 text-slate-700">
              <div className="w-8 h-8 rounded-lg bg-lavender-100 flex items-center justify-center">
                <Check className="w-4 h-4 text-lavender-600" />
              </div>
              <span>Personal bookmarks and notes</span>
            </div>
            <div className="flex items-center gap-3 text-slate-700">
              <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center">
                <Check className="w-4 h-4 text-rose-600" />
              </div>
              <span>Track your learning progress</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Register Form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-900">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-sage-500 flex items-center justify-center">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-heading font-bold">PMR Atlas</span>
          </div>

          <Card className="border-0 shadow-xl" data-testid="register-card">
            <CardHeader className="space-y-1 pb-6">
              <CardTitle className="text-2xl font-heading">Create an account</CardTitle>
              <CardDescription>
                Enter your details to get started
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-lg" data-testid="register-error">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-10"
                      required
                      data-testid="register-name"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                      data-testid="register-email"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Create a password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10"
                      required
                      data-testid="register-password"
                    />
                  </div>
                  {password && (
                    <div className="space-y-1 mt-2">
                      {passwordRequirements.map((req, i) => (
                        <div key={i} className={`flex items-center gap-2 text-xs ${req.met ? 'text-sage-600' : 'text-slate-400'}`}>
                          <div className={`w-3 h-3 rounded-full border ${req.met ? 'bg-sage-500 border-sage-500' : 'border-slate-300'} flex items-center justify-center`}>
                            {req.met && <Check className="w-2 h-2 text-white" />}
                          </div>
                          <span>{req.text}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10"
                      required
                      data-testid="register-confirm-password"
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-sage-600 hover:bg-sage-700 text-white"
                  disabled={isLoading}
                  data-testid="register-submit"
                >
                  {isLoading ? 'Creating account...' : 'Create account'}
                </Button>
              </form>

              <div className="mt-6 text-center text-sm">
                <span className="text-slate-500">Already have an account? </span>
                <Link 
                  to="/login" 
                  className="text-sage-600 hover:text-sage-700 font-medium"
                  data-testid="login-link"
                >
                  Sign in
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
