import React, { useState } from 'react';
    import { Routes, Route, useNavigate } from 'react-router-dom';
    import { createClient } from '@supabase/supabase-js';
    import LoginPage from './LoginPage';
    import InspirationPage from './InspirationPage';
    import ModuleSelectionPage from './ModuleSelectionPage';
    import TigerGamePage from './TigerGamePage';
    import Tracker from './TigerGamePage';
    import TigerGameHistory from './TigerGameHistoryPage';
    import InspirationHistoryPage from './InspirationHistoryPage';
    import LazyDiaryPage from './LazyDiaryPage';
    import EditQuestionsPage from './EditQuestionsPage';
    import AdminPage from './AdminPage';
    import LazyDiaryHistoryPage from './LazyDiaryHistoryPage';

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
          <Route path="/inspiration/history" element={<InspirationHistoryPage loggedInUser={loggedInUser} supabase={supabase} onLogout={handleLogout} />} />
          <Route path="/tiger-game" element={<Tracker loggedInUser={loggedInUser} onLogout={handleLogout} />} />
          <Route path="/tiger-game/history" element={<TigerGameHistory loggedInUser={loggedInUser} onLogout={handleLogout} />} />
          <Route path="/lazy-diary" element={<LazyDiaryPage loggedInUser={loggedInUser} onLogout={handleLogout} />} />
          <Route path="/lazy-diary/history" element={<LazyDiaryHistoryPage loggedInUser={loggedInUser} onLogout={handleLogout} />} />
          <Route path="/edit-questions" element={<EditQuestionsPage loggedInUser={loggedInUser} onLogout={handleLogout} />} />
          <Route path="/admin" element={<AdminPage loggedInUser={loggedInUser} onLogout={handleLogout} />} />
        </Routes>
      );
    }

    export default App;
