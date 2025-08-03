import React, { useState } from 'react';
import Login from './Login';
import Signup from './Signup';

const AuthForm = () => {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="w-full max-w-md mx-auto bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg">
      <div className="flex justify-center mb-6">
        <button
          className={`px-4 py-2 rounded-md text-sm font-medium ${isLogin ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200'}`}
          onClick={() => setIsLogin(true)}
        >
          Login
        </button>
        <button
          className={`ml-4 px-4 py-2 rounded-md text-sm font-medium ${!isLogin ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200'}`}
          onClick={() => setIsLogin(false)}
        >
          Sign Up
        </button>
      </div>
      {isLogin ? <Login /> : <Signup />}
    </div>
  );
};

export default AuthForm;
