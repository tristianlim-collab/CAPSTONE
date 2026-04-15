import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert } from 'lucide-react';

const Unauthorized = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const goHome = () => {
    if (!user) return navigate('/login');
    if (user.role === 'ADMIN') navigate('/admin/dashboard');
    else if (user.role === 'RESPONSE_UNIT') navigate('/response/shift-start');
    else navigate('/reporter/home');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative background blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-400/10 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-orange-400/10 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
      
      <div className="bg-white/80 backdrop-blur-xl p-10 rounded-[2rem] border border-white/40 max-w-md w-full text-center shadow-xl relative z-10">
        <div className="mx-auto w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center border border-red-100 mb-6 shadow-sm">
          <ShieldAlert className="w-10 h-10" />
        </div>
        <h1 className="text-3xl font-bold text-slate-800 mb-3">Access Denied</h1>
        <p className="text-slate-500 mb-8 leading-relaxed">
          You don't have the required permissions to view this page. If you believe this is an error, please contact the administrator.
        </p>
        <Button 
          fullWidth 
          onClick={goHome}
          className="bg-slate-800 hover:bg-slate-900 text-white shadow-lg shadow-slate-800/20"
        >
          Return to Dashboard
        </Button>
      </div>
    </div>
  );
};

export default Unauthorized;
