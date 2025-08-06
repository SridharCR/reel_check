import React, { useContext } from 'react';
import AuthForm from './components/Auth/AuthForm';
import { Dashboard } from './components/Dashboard';
import { AuthContext, AuthProvider } from 'contexts/AuthContext';
import { ThemeContext, ThemeProvider } from 'contexts/ThemeContext';

const AppContent = () => {
  const { isAuthenticated, logout } = useContext(AuthContext);
  const { theme, toggleTheme } = useContext(ThemeContext);

  return (
    <div className="w-[40rem] h-[30rem] p-6 flex flex-col bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 overflow-auto rounded-lg shadow-xl">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">ReelCheck</h1>
        <div className="flex items-center space-x-2">
          <button
            onClick={toggleTheme}
            className="py-1 px-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md text-sm"
          >
            {theme === 'light' ? '☀️' : '🌙'}
          </button>
          {isAuthenticated && (
            <button
              onClick={logout}
              className="py-1 px-3 bg-red-600 text-white rounded-md text-sm hover:bg-red-700"
            >
              Logout
            </button>
          )}
        </div>
      </div>
      {isAuthenticated ? (
        <Dashboard />
      ) : (
        <AuthForm />
      )}
    </div>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </AuthProvider>
  );
};

export default App;
