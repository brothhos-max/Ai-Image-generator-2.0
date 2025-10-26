import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="w-full p-4 md:p-6 text-center">
      <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-600">
        AI Image Studio
      </h1>
      <p className="mt-2 text-lg text-gray-400">
        Generate and Enhance Images with Gemini
      </p>
    </header>
  );
};

export default Header;
