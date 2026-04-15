import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { ShieldCheck } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);
    try {
      const user = await login(email, password);
      toast.success('Login successful');
      if (user.role === 'ADMIN') navigate('/admin/dashboard');
      else if (user.role === 'RESPONSE_UNIT') navigate('/response/shift-start');
      else navigate('/reporter/home');
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Invalid email or password');
      toast.error('Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white/80 backdrop-blur-xl w-full max-w-[430px] rounded-[2rem] border border-white/40 p-8 shadow-xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl mb-4 shadow-sm border border-blue-100/50 transform rotate-3">
            <ShieldCheck className="w-7 h-7 -rotate-3" />
          </div>
          <h1 className="text-4xl font-black tracking-widest uppercase mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            GAOIRS
          </h1>
          <h2 className="text-2xl font-bold text-slate-800">Welcome back</h2>
          <p className="text-slate-500 mt-2">Sign in to your account</p>
        </div>

        {errorMsg && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-xl mb-6 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input 
            label="Email" 
            type="email" 
            placeholder="Enter your email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
            className="border-slate-200 focus:ring-blue-500"
          />
          <Input 
            label="Password" 
            type="password" 
            placeholder="Enter your password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
            showPasswordToggle 
            className="border-slate-200 focus:ring-blue-500"
          />
          
          <div className="flex items-center justify-between mt-2">
            <label className="flex items-center text-sm text-slate-600 cursor-pointer">
              <input type="checkbox" className="mr-2 rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer" />
              Remember me
            </label>
            <a href="#" className="text-sm font-medium text-blue-600 hover:text-blue-500">
              Forgot password?
            </a>
          </div>

          <Button type="submit" fullWidth loading={loading} className="mt-6 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20">
            Sign In
          </Button>

          <div className="my-6 flex items-center">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="px-4 text-sm text-slate-400">or</span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          <button
            type="button"
            className="w-full flex items-center justify-center gap-3 bg-white text-slate-700 font-medium py-2.5 px-4 rounded-xl hover:bg-slate-50 transition-colors border border-slate-200 shadow-sm hover:shadow-md"
            onClick={() => toast.error('Google login not implemented yet')}
          >
            <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Sign in with Google
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-blue-600 hover:text-blue-700 font-medium">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
