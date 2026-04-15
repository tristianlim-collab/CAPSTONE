const fs = require('fs');
const path = require('path');

const files = {
  // ---------------- BACKEND ----------------
  'backend/src/controllers/authController.js': `const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.register = async (req, res) => {
  try {
    const { name, email, password, role, contact_number } = req.body;
    
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    
    const userRole = role === 'RESPONSE_UNIT' ? 'RESPONSE_UNIT' : 'REPORTER';

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: userRole,
        contact_number
      }
    });

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, email: true, role: true, contact_number: true, is_active: true }
    });
    
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching profile' });
  }
};
`,
  'backend/src/routes/authRoutes.js': `const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth'); // Assume auth middleware is implemented in auth.js

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', protect, authController.getMe);

module.exports = router;
`,
  'backend/src/controllers/userController.js': `const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const users = await prisma.user.findMany({
      skip,
      take: limit,
      select: { id: true, name: true, email: true, role: true, is_active: true }
    });
    
    const total = await prisma.user.count();

    res.json({
      data: users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users' });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: { id: true, name: true, email: true, role: true, is_active: true, contact_number: true }
    });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user' });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { name, email, role, contact_number } = req.body;
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { name, email, role, contact_number },
      select: { id: true, name: true, email: true, role: true }
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error updating user' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    await prisma.user.delete({ where: { id: req.params.id } });
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting user' });
  }
};

exports.toggleStatus = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    const updatedUser = await prisma.user.update({
      where: { id: req.params.id },
      data: { is_active: !user.is_active },
      select: { id: true, is_active: true, name: true }
    });
    
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: 'Error toggling user status' });
  }
};
`,
  'backend/src/routes/userRoutes.js': `const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth'); // Assume authorize allows roles

router.use(protect);
router.use(authorize('ADMIN'));

router.get('/', userController.getAllUsers);
router.get('/:id', userController.getUserById);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);
router.patch('/:id/toggle', userController.toggleStatus);

module.exports = router;
`,

  // ---------------- FRONTEND ----------------
  'frontend/src/api/authAPI.js': `import axiosInstance from './index'; // Default instance

export const authAPI = {
  login: async (email, password) => {
    const response = await axiosInstance.post('/auth/login', { email, password });
    return response.data;
  },
  register: async (userData) => {
    const response = await axiosInstance.post('/auth/register', userData);
    return response.data;
  },
  getMe: async () => {
    const response = await axiosInstance.get('/auth/me');
    return response.data;
  }
};
`,
  'frontend/src/components/common/LoadingSpinner.jsx': `import React from 'react';

const LoadingSpinner = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-10 h-10 border-4'
  };

  return (
    <div className={\`inline-block animate-spin rounded-full border-solid border-r-transparent align-[-0.125em] text-orange-500 border-current \${sizeClasses[size]} \${className}\`} role="status">
      <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">Loading...</span>
    </div>
  );
};

export default LoadingSpinner;
`,
  'frontend/src/components/common/Button.jsx': `import React from 'react';
import LoadingSpinner from './LoadingSpinner';

const Button = ({ children, variant = 'primary', size = 'md', loading = false, disabled = false, fullWidth = false, icon, className = '', ...props }) => {
  const baseClasses = 'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 disabled:pointer-events-none';
  
  const variants = {
    primary: 'bg-orange-500 text-white hover:bg-orange-600 focus:ring-orange-500',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-600',
    ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-500'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  const classes = \`\${baseClasses} \${variants[variant]} \${sizes[size]} \${fullWidth ? 'w-full' : ''} \${className}\`;

  return (
    <button className={classes} disabled={disabled || loading} {...props}>
      {loading && <LoadingSpinner size="sm" className="mr-2" />}
      {!loading && icon && <span className="mr-2">{icon}</span>}
      {children}
    </button>
  );
};

export default Button;
`,
  'frontend/src/components/common/Input.jsx': `import React, { useState } from 'react';

const Input = ({ label, type = 'text', error, showPasswordToggle, fullWidth = true, className = '', icon, ...props }) => {
  const [showPassword, setShowPassword] = useState(false);
  
  const isPassword = type === 'password';
  const inputType = isPassword && showPassword ? 'text' : type;

  return (
    <div className={\`flex flex-col gap-1 \${fullWidth ? 'w-full' : ''} \${className}\`}>
      {label && <label className="text-sm font-medium text-gray-300">{label}</label>}
      <div className="relative">
        {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{icon}</div>}
        <input
          type={inputType}
          className={\`w-full h-10 rounded-lg border bg-slate-900 px-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors \${error ? 'border-red-500 focus:ring-red-500' : 'border-slate-700'} \${icon ? 'pl-10' : ''} \${isPassword && showPasswordToggle ? 'pr-10' : ''}\`}
          {...props}
        />
        {isPassword && showPasswordToggle && (
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 hover:text-white"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? 'Hide' : 'Show'}
          </button>
        )}
      </div>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
};

export default Input;
`,
  'frontend/src/context/AuthContext.jsx': `import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../api/authAPI';
import toast from 'react-hot-toast';
import axiosInstance from '../api/index';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          axiosInstance.defaults.headers.common['Authorization'] = \`Bearer \${token}\`;
          const userData = await authAPI.getMe();
          setUser(userData);
        } catch (error) {
          console.error("Auth init failed", error);
          localStorage.removeItem('token');
          delete axiosInstance.defaults.headers.common['Authorization'];
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email, password) => {
    const data = await authAPI.login(email, password);
    localStorage.setItem('token', data.token);
    axiosInstance.defaults.headers.common['Authorization'] = \`Bearer \${data.token}\`;
    setUser(data.user);
    return data.user;
  };

  const register = async (userData) => {
    const data = await authAPI.register(userData);
    localStorage.setItem('token', data.token);
    axiosInstance.defaults.headers.common['Authorization'] = \`Bearer \${data.token}\`;
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axiosInstance.defaults.headers.common['Authorization'];
    setUser(null);
  };

  const hasRole = (role) => {
    return user?.role === role;
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, isAuthenticated, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
};
`,
  'frontend/src/components/common/ProtectedRoute.jsx': `import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

export const ProtectedRoute = ({ role, children }) => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-900"><LoadingSpinner size="lg" /></div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (role && user.role !== role) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children || <Outlet />;
};

export const PublicRoute = ({ children }) => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-900"><LoadingSpinner size="lg" /></div>;
  }

  if (isAuthenticated && user) {
    if (user.role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
    if (user.role === 'RESPONSE_UNIT') return <Navigate to="/response/shift-start" replace />;
    if (user.role === 'REPORTER') return <Navigate to="/reporter/home" replace />;
  }

  return children || <Outlet />;
};
`,
  'frontend/src/pages/auth/Unauthorized.jsx': `import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';

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
    <div className="min-h-screen bg-[#0F172A] flex flex-col items-center justify-center p-4">
      <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 max-w-md w-full text-center">
        <h1 className="text-3xl font-bold text-red-500 mb-4">Access Denied</h1>
        <p className="text-slate-300 mb-8">You don't have permission to view this page.</p>
        <Button fullWidth onClick={goHome}>Go to Dashboard</Button>
      </div>
    </div>
  );
};

export default Unauthorized;
`,
  'frontend/src/pages/auth/Login.jsx': `import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';

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
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-4">
      <div className="bg-slate-800 w-full max-w-[430px] rounded-2xl border border-slate-700 p-8 shadow-xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-orange-500/20 text-orange-500 rounded-full mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">Welcome back</h1>
          <p className="text-slate-400 mt-2">Sign in to your account</p>
        </div>

        {errorMsg && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm p-3 rounded-lg mb-6">
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
          />
          <Input 
            label="Password" 
            type="password" 
            placeholder="Enter your password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
            showPasswordToggle 
          />
          
          <div className="flex items-center justify-between mt-2">
            <label className="flex items-center text-sm text-slate-300">
              <input type="checkbox" className="mr-2 rounded bg-slate-900 border-slate-700 text-orange-500 focus:ring-orange-500" />
              Remember me
            </label>
          </div>

          <Button type="submit" fullWidth loading={loading} className="mt-6">
            Sign In
          </Button>
        </form>

        <p className="text-center text-sm text-slate-400 mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-orange-500 hover:text-orange-400 font-medium">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
`,
  'frontend/src/pages/auth/Register.jsx': `import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';

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
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-4">
      <div className="bg-slate-800 w-full max-w-[430px] rounded-2xl border border-slate-700 p-8 shadow-xl mt-8 mb-8">
        <div className="mb-6">
          <Link to="/login" className="text-sm text-slate-400 hover:text-white flex items-center">
            &larr; Back to login
          </Link>
        </div>
        
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white">Create Account</h1>
          <p className="text-slate-400 mt-2">Join GAOIRS platform</p>
        </div>

        {errorMsg && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm p-3 rounded-lg mb-6">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Full Name" name="name" type="text" placeholder="John Doe" value={formData.name} onChange={handleChange} required />
          <Input label="Email" name="email" type="email" placeholder="john@example.com" value={formData.email} onChange={handleChange} required />
          <Input label="Password" name="password" type="password" placeholder="Min. 8 characters" value={formData.password} onChange={handleChange} required showPasswordToggle />
          <Input label="Confirm Password" name="confirmPassword" type="password" placeholder="Type password again" value={formData.confirmPassword} onChange={handleChange} required />
          <Input label="Contact Number" name="contact_number" type="tel" placeholder="+1234567890" value={formData.contact_number} onChange={handleChange} required />
          
          <div className="flex flex-col gap-1 w-full">
            <label className="text-sm font-medium text-gray-300">Role</label>
            <select 
              name="role" 
              value={formData.role} 
              onChange={handleChange}
              className="w-full h-10 rounded-lg border border-slate-700 bg-slate-900 px-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="REPORTER">Reporter</option>
              <option value="RESPONSE_UNIT">Response Unit</option>
            </select>
          </div>

          <Button type="submit" fullWidth loading={loading} className="mt-6">
            Register
          </Button>
        </form>

        <p className="text-center text-sm text-slate-400 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-orange-500 hover:text-orange-400 font-medium">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
`,
  'frontend/src/App.jsx': `import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute, PublicRoute } from './components/common/ProtectedRoute';

import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Unauthorized from './pages/auth/Unauthorized';

// Placeholder Shells for Routing Demo
const AdminDashboard = () => <div className="text-white p-8">Admin Dashboard Shell</div>;
const ResponseShift = () => <div className="text-white p-8">Response Shift Start Shell</div>;
const ReporterHome = () => <div className="text-white p-8">Reporter Home Shell</div>;

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Admin Routes */}
          <Route path="/admin/*" element={<ProtectedRoute role="ADMIN"><AdminDashboard /></ProtectedRoute>} />

          {/* Response Unit Routes */}
          <Route path="/response/*" element={<ProtectedRoute role="RESPONSE_UNIT"><ResponseShift /></ProtectedRoute>} />

          {/* Reporter Routes */}
          <Route path="/reporter/*" element={<ProtectedRoute role="REPORTER"><ReporterHome /></ProtectedRoute>} />

          {/* Default redirect based on auth status done in PublicRoute, else map to login */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
        <Toaster position="top-right" />
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
`
};

for (const [filePath, content] of Object.entries(files)) {
  const fullPath = path.join(__dirname, filePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content, 'utf8');
  console.log('Created:', filePath);
}
