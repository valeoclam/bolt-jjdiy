import React, { useState, useEffect } from 'react';
    import { useNavigate } from 'react-router-dom';
    import supabase from './supabaseClient';

    function ModuleSelectionPage({ loggedInUser, onLogout }) {
      const navigate = useNavigate();
      const [allowedModules, setAllowedModules] = useState([]);
      const [loading, setLoading] = useState(true);

      useEffect(() => {
        if (loggedInUser) {
          fetchAllowedModules();
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

      useEffect(() => {
        if (allowedModules.length === 1) {
          const module = allowedModules[0];
          if (module === 'inspiration') {
            navigate('/inspiration');
          } else if (module === 'tiger-game') {
            navigate('/tiger-game');
          } else if (module === 'lazy-diary') {
            navigate('/lazy-diary');
          }
        }
      }, [allowedModules, navigate]);

      const handleInspirationClick = () => {
        navigate('/inspiration');
      };

      const handleTigerGameClick = () => {
        navigate('/tiger-game');
      };

      const handleLazyDiaryClick = () => {
        navigate('/lazy-diary');
      };

      const handleAdminClick = () => {
        navigate('/admin');
      };

      return (
        <div className="container" style={{ padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h2 style={{ marginBottom: '30px' }}>神奇百宝箱</h2>
          {loggedInUser && <p style={{ marginBottom: '20px' }}>当前用户: {loggedInUser.username}</p>}
          {loading ? <p>加载中...</p> : (
            <div className="module-list" style={{ width: '100%', maxWidth: '400px' }}>
              {allowedModules.includes('inspiration') && (
                <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                  <button type="button" onClick={handleInspirationClick} className="module-button inspiration-button" style={{ flex: 1, padding: '20px', fontSize: '20px', backgroundColor: '#28a745' }}>灵感随记</button>
                </div>
              )}
              {allowedModules.includes('tiger-game') && (
                <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                  <button type="button" onClick={handleTigerGameClick} className="module-button tiger-game-button" style={{ flex: 1, padding: '20px', fontSize: '20px' }}>打虎日记</button>
                </div>
              )}
              {allowedModules.includes('lazy-diary') && (
                <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                  <button type="button" onClick={handleLazyDiaryClick} className="module-button lazy-diary-button" style={{ flex: 1, padding: '20px', fontSize: '20px', backgroundColor: '#800080' }}>懒人日记</button>
                </div>
              )}
            </div>
          )}
          {loggedInUser && loggedInUser.role === 'admin' && (
            <button type="button" onClick={handleAdminClick} className="module-button admin-button" style={{ padding: '20px', fontSize: '20px', backgroundColor: '#dc3545', marginTop: '10px' }}>后台管理</button>
          )}
          <button type="button" onClick={onLogout} className="logout-button" style={{ marginTop: '30px', padding: '15px 20px' }}>退出</button>
        </div>
      );
    }

    export default ModuleSelectionPage;
