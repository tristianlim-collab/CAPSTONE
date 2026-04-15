import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { FiMail, FiLock, FiAlertCircle } from 'react-icons/fi';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const user = await login(formData.email, formData.password);
      toast.success('Login successful!');

      // Redirect based on role
      if (user.role === 'RESPONDER' || user.role === 'RESPONSE_UNIT' || user.role === 'ADMIN') {
        navigate('/response/dashboard');
      } else {
        navigate('/dashboard'); // Residents or reporters go here
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        {/* Logo/Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
            <FiAlertCircle className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-white">GAOIRS</h1>
          <p className="text-gray-400 mt-2">Incident Reporter Portal</p>
        </div>

        {/* Login Form */}
        <div className="bg-dark-card border border-dark-border rounded-lg p-8">
          <h2 className="text-2xl font-semibold text-white mb-6">Login</h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full bg-dark-bg border border-dark-border rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full bg-dark-bg border border-dark-border rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          {/* Register Link */}
          <p className="text-center text-gray-400 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary hover:underline">
              Register here
            </Link>
          </p>
        </div>

        {/* Quick Test Accounts */}
        <div className="mt-6 p-4 bg-dark-card/50 border border-dark-border rounded-lg">
          <p className="text-xs text-gray-400 mb-2 font-semibold">Test Accounts:</p>
          <div className="space-y-1">
            <p className="text-xs text-gray-500">
              <span className="text-gray-400">Admin:</span> admin@gaoirs.com / admin123
            </p>
            <p className="text-xs text-gray-500">
              <span className="text-gray-400">Resident:</span> resident@test.com / reporter123
            </p>
            <p className="text-xs text-gray-500">
              <span className="text-gray-400">Fire Unit:</span> fire.alpha@gaoirs.com / response123
            </p>
            <p className="text-xs text-gray-500">
              <span className="text-gray-400">Police Unit:</span> police.bravo@gaoirs.com / response123
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
