import React, { useState } from 'react';
import Login from './Login';
import Signup from './Signup';

const AuthForm = () => {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="w-full max-w-md mx-auto bg-white dark:bg-gray-800 p-10 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700">
      <div className="flex justify-center mb-6">
        <button
          className={`flex-1 py-3 rounded-lg text-base font-semibold transition-all duration-300 ${isLogin ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
          onClick={() => setIsLogin(true)}
        >
          Login
        </button>
        <button
          className={`ml-4 flex-1 py-3 rounded-lg text-base font-semibold transition-all duration-300 ${!isLogin ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
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
