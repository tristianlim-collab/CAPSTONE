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

      const role = user.role;
      if (role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else if (role === 'RESPONSE_UNIT') {
        navigate('/response/map');
      } else {
        navigate('/reporter/home');
      }
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

          <div className="text-center text-sm text-slate-500 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-blue-600 hover:text-blue-700 font-medium tracking-normal">
              Register here
            </Link>
          </div>
        </form>

        <div className="flex flex-col items-center gap-4 mt-8 pt-6 border-t border-slate-100 uppercase tracking-tighter">
          <Link
            to="/reporter/home"
            className="text-blue-600 hover:text-blue-700 font-black text-xs"
          >
            Report Emergency (No login required)
          </Link>
          <p className="text-[10px] text-slate-400 font-bold">
            ADMIN OR RESPONSE UNIT? USE THE FORM ABOVE
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
