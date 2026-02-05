import React from 'react';

const Home = () => (
  <div className="pt-24 min-h-screen flex flex-col items-center justify-center bg-gray-900 px-4">
    {/* Title - scales perfectly on mobile, tablet, desktop */}
    <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-blue-400 text-center mb-6 leading-tight">
      Welcome to Atlas2.0
    </h1>

    {/* Subtitle - also scales nicely */}
    <p className="text-lg sm:text-xl md:text-2xl text-gray-300 text-center max-w-lg">
      Your amazing one stop shop is loading ...
    </p>
  </div>
);

export default Home;