import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import supabase from './supabaseClient';
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
import TestNavigationPage from './TestNavigationPage';
import PaymentMultiplierCalculator from './PaymentMultiplierCalculator';
import OfflinePaymentMultiplierCalculator from './OfflinePaymentMultiplierCalculator';
import OfflineTigerGamePage from './OfflineTigerGamePage'; // 导入 OfflineTigerGamePage


function App() {
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [allowedModules, setAllowedModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (loggedInUser) {
      fetchAllowedModules();
    } else {
      setLoading(false);
    }
  }, [loggedInUser]);

  const fetchAllowedModules = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('allowed_modules')
        .eq('id', loggedInUser.id)
        .single();
      if (error) {
        console.error('获取用户模块失败:', error);
      } else {
        setAllowedModules(data?.allowed_modules ? JSON.parse(data.allowed_modules) : []);
      }
    } catch (error) {
      console.error('发生意外错误:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSuccess = (user) => {
    setLoggedInUser(user);
    if (allowedModules.length !== 1) {
      navigate('/modules');
    }
  };

  const handleLogout = () => {
    if (window.confirm('确定要退出吗？')) {
      setLoggedInUser(null);
      navigate('/');
    }
  };

  if (loading) {
    return <p>加载中...</p>;
  }

  return (
    <Routes>
      <Route path="/" element={<LoginPage onLoginSuccess={handleLoginSuccess} supabase={supabase} />} />
      <Route path="/modules" element={<ModuleSelectionPage loggedInUser={loggedInUser} onLogout={handleLogout} />} />
      {allowedModules.includes('inspiration') && (
        <>
          <Route path="/inspiration" element={<InspirationPage loggedInUser={loggedInUser} supabase={supabase} onLogout={handleLogout} />} />
          <Route path="/inspiration/history" element={<InspirationHistoryPage loggedInUser={loggedInUser} supabase={supabase} onLogout={handleLogout} />} />
        </>
      )}
      {allowedModules.includes('tiger-game') && (
        <>
          <Route path="/tiger-game" element={<TigerGamePage loggedInUser={loggedInUser} onLogout={handleLogout} />} />
          <Route path="/tiger-game/history" element={<TigerGameHistory loggedInUser={loggedInUser} onLogout={handleLogout} />} />
        </>
      )}
      {allowedModules.includes('lazy-diary') && (
        <>
          <Route path="/lazy-diary" element={<LazyDiaryPage loggedInUser={loggedInUser} onLogout={handleLogout} />} />
          <Route path="/lazy-diary/history" element={<LazyDiaryHistoryPage loggedInUser={loggedInUser} onLogout={handleLogout} allowedModules={allowedModules} />} />
        </>
      )}
      <Route path="/edit-questions" element={<EditQuestionsPage loggedInUser={loggedInUser} onLogout={handleLogout} supabase={supabase} />} />
      {loggedInUser && loggedInUser.role === 'admin' && (
        <Route path="/admin" element={<AdminPage loggedInUser={loggedInUser} onLogout={handleLogout} />} />
      )}
      <Route path="/test-navigation" element={<TestNavigationPage loggedInUser={loggedInUser} onLogout={handleLogout} />} />
      <Route path="/payment-multiplier-calculator" element={<PaymentMultiplierCalculator loggedInUser={loggedInUser} onLogout={handleLogout} />} />
      <Route path="/offline-calculator" element={<OfflinePaymentMultiplierCalculator />} />
      <Route path="/offline-tiger-game" element={<OfflineTigerGamePage onLogout={handleLogout} />} />
    </Routes>
  );
}

export default App;
