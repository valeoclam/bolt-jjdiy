import React, { useState, useEffect } from 'react';
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
import TestNavigationPage from './TestNavigationPage';
import PaymentMultiplierCalculator from './PaymentMultiplierCalculator';
import { getStoredToken, clearToken, validateToken, refreshToken, storeToken, validateTokenLocally } from './utils/auth'; // 修改引用

const supabaseUrl = 'https://fhcsffagxchzpxouuiuq.supabase.co'; // Replace with your Supabase URL
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZoY3NmZmFneGNoenB4b3V1aXVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzYyMTQzMzAsImV4cCI6MjA1MTc5MDMzMH0.1DMl870gjGRq5LRlQMES9WpYWehiKiPIea2Yj1q4Pz8'; // Replace with your Supabase anon API key
const supabase = createClient(supabaseUrl, supabaseKey);

function App() {
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [allowedModules, setAllowedModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const checkStoredToken = async () => {
      setLoading(true);
      let token = await getStoredToken();
      if (token) {
        // 验证 JWT 的有效性
        let isValid = false;
        if (isOnline) {
          isValid = await validateToken(token, supabase);
          if (!isValid) {
            // 如果 JWT 过期，则尝试刷新 JWT
            const newToken = await refreshToken(supabase);
            if (newToken) {
              token = newToken;
              await storeToken(newToken);
              isValid = true;
            } else {
              clearToken();
            }
          }
        } else {
          isValid = validateTokenLocally(token);
        }
        if (isValid) {
          try {
            const { data, error } = await supabase.auth.getUser(token);
            if (data && data.user) {
              console.log('离线登录成功:', data.user);
              setLoggedInUser({ ...data.user, role: data.user.role });
            } else {
              console.error('JWT 验证失败:', error);
              clearToken();
            }
          } catch (error) {
            console.error('JWT 验证失败:', error);
            clearToken();
          }
        }
      }
      setLoading(false);
    };
    checkStoredToken();
  }, [isOnline]);

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
      clearToken();
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
          <Route path="/tiger-game" element={<Tracker loggedInUser={loggedInUser} onLogout={handleLogout} />} />
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
    </Routes>
  );
}

export default App;
