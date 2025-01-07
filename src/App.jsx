import React, { useState } from 'react';
    import { Routes, Route, useNavigate } from 'react-router-dom';
    import { createClient } from '@supabase/supabase-js';
    import LoginPage from './LoginPage';
    import InspirationPage from './InspirationPage';
    import HistoryPage from './HistoryPage';
    import ModuleSelectionPage from './ModuleSelectionPage';
    import TigerGamePage from './TigerGamePage';

    const supabaseUrl = 'https://fhcsffagxchzpxouuiuq.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZoY3NmZmFneGNoenB4b3V1aXVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzYyMTQzMzAsImV4cCI6MjA1MTc5MDMzMH0.1DMl870gjGRq5LRlQMES9WpYWehiKiPIea2Yj1q4Pz8';
    const supabase = createClient(supabaseUrl, supabaseKey);

    function App() {
      const [loggedInUser, setLoggedInUser] = useState(null);
      const navigate = useNavigate();

      const handleLoginSuccess = (user) => {
        setLoggedInUser(user);
        navigate('/modules');
      };

      const handleLogout = () => {
        if (window.confirm('确定要退出吗？')) {
          setLoggedInUser(null);
          navigate('/');
        }
      };

      return (
        <Routes>
          <Route path="/" element={<LoginPage onLoginSuccess={handleLoginSuccess} supabase={supabase} />} />
          <Route path="/modules" element={<ModuleSelectionPage loggedInUser={loggedInUser} onLogout={handleLogout} />} />
          <Route path="/inspiration" element={<InspirationPage loggedInUser={loggedInUser} supabase={supabase} onLogout={handleLogout} />} />
          <Route path="/history" element={<HistoryPage loggedInUser={loggedInUser} supabase={supabase} onLogout={handleLogout} />} />
          <Route path="/tiger-game" element={<TigerGamePage loggedInUser={loggedInUser} onLogout={handleLogout} />} />
        </Routes>
      );
    }

    export default App;
