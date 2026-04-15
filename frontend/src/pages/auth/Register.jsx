import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { ArrowLeft, UserPlus } from 'lucide-react';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    contact_number: '',
    role: 'REPORTER'
  });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    
    if (formData.password !== formData.confirmPassword) {
      setErrorMsg('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await register(formData);
      toast.success('Registration successful');
      navigate('/login');
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Registration failed');
      toast.error('Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white/80 backdrop-blur-xl w-full max-w-[430px] rounded-[2rem] border border-white/40 p-8 shadow-xl mt-8 mb-8 relative">
        <div className="absolute top-6 left-6 z-10">
          <Link to="/login" className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors shadow-sm border border-slate-200">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </div>
        
        <div className="text-center mb-8 mt-4">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl mb-4 shadow-sm border border-indigo-100/50 transform rotate-3">
            <UserPlus className="w-7 h-7 -rotate-3" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Create Account</h1>
          <p className="text-slate-500 mt-2">Join the GAOIRS platform</p>
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
          <Input label="Full Name" name="name" type="text" placeholder="John Doe" value={formData.name} onChange={handleChange} required className="border-slate-200 focus:ring-blue-500" />
          <Input label="Email" name="email" type="email" placeholder="john@example.com" value={formData.email} onChange={handleChange} required className="border-slate-200 focus:ring-blue-500" />
          <Input label="Password" name="password" type="password" placeholder="Min. 8 characters" value={formData.password} onChange={handleChange} required showPasswordToggle className="border-slate-200 focus:ring-blue-500" />
          <Input label="Confirm Password" name="confirmPassword" type="password" placeholder="Type password again" value={formData.confirmPassword} onChange={handleChange} required className="border-slate-200 focus:ring-blue-500" />
          <Input label="Contact Number" name="contact_number" type="tel" placeholder="+1234567890" value={formData.contact_number} onChange={handleChange} required className="border-slate-200 focus:ring-blue-500" />
          
          <div className="flex flex-col gap-1 w-full">
            <label className="text-sm font-medium text-slate-700">Role</label>
            <select 
              name="role" 
              value={formData.role} 
              onChange={handleChange}
              className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
            >
              <option value="REPORTER">Reporter</option>
              <option value="RESPONSE_UNIT">Response Unit</option>
            </select>
          </div>

          <Button type="submit" fullWidth loading={loading} className="mt-6 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20">
            Register
          </Button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
