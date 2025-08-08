import React, { useState, useContext } from 'react';
import { loginUser } from '../../api/api';
import { AuthContext } from 'contexts/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const { login } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const data = await loginUser(email, password);
      login(data.access_token, { email: email }); // Assuming API returns access_token and user email
    } catch (err) {
      setError(err.message || 'An error occurred during login.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Username</label>
        <input
          type="input"
          id="email"
          className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition duration-200 ease-in-out focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
        <input
          type="password"
          id="password"
          className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition duration-200 ease-in-out focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      <button
        type="submit"
        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-base font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-200 ease-in-out"
      >
        Login
      </button>
    </form>
  );
};

export default Login;
