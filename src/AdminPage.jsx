import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from './supabaseClient';

function AdminPage({ loggedInUser, onLogout }) {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [allowedModules, setAllowedModules] = useState([]);
  const allModules = {
    'inspiration': '灵感随记',
    'tiger-game': '打虎日记',
    'lazy-diary': '懒人日记'
  };

  useEffect(() => {
    if (loggedInUser && loggedInUser.role === 'admin') {
      fetchUsers();
    }
  }, [loggedInUser]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, username, allowed_modules');
      if (error) {
        console.error('获取用户列表失败:', error);
      } else {
        setUsers(data);
      }
    } catch (error) {
      console.error('发生意外错误:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserSelect = (user) => {
    setSelectedUser(user);
    setAllowedModules(user.allowed_modules ? JSON.parse(user.allowed_modules) : []);
  };

  const handleModuleChange = (module, checked) => {
    if (checked) {
      setAllowedModules([...allowedModules, module]);
    } else {
      setAllowedModules(allowedModules.filter(m => m !== module));
    }
  };

  const handleSaveModules = async () => {
    if (!selectedUser) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .update({ allowed_modules: JSON.stringify(allowedModules) })
        .eq('id', selectedUser.id);
      if (error) {
        console.error('更新用户模块失败:', error);
      } else {
        console.log('用户模块更新成功:', data);
        fetchUsers();
      }
    } catch (error) {
      console.error('发生意外错误:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditQuestionsClick = () => {
    navigate('/edit-questions');
  };

  const handleBackToModules = () => {
    navigate('/modules');
  };

  const handleTestNavigationClick = () => {
    navigate('/test-navigation');
  };

  const handlePaymentMultiplierCalculatorClick = () => {
    navigate('/payment-multiplier-calculator');
  };

  return (
    <div className="container">
      <h2>后台管理</h2>
      {loggedInUser && <p>当前用户: {loggedInUser.username}</p>}
      <button type="button" onClick={onLogout} className="logout-button">退出</button>
      <button type="button" onClick={handleBackToModules} style={{ marginTop: '10px', backgroundColor: '#6c757d' }}>返回神奇百宝箱</button>
      <div className="module-list" style={{ width: '100%', maxWidth: '400px' }}>
        <button type="button" onClick={handleEditQuestionsClick} className="module-button edit-questions-button" style={{ padding: '20px', fontSize: '20px', backgroundColor: '#007bff' }}>懒人日记-问题库管理</button>
         <button type="button" onClick={handleTestNavigationClick} className="module-button test-navigation-button" style={{ padding: '20px', fontSize: '20px', backgroundColor: '#28a745' }}>测试页面</button>
         <button type="button" onClick={handlePaymentMultiplierCalculatorClick} className="module-button payment-multiplier-button" style={{ padding: '20px', fontSize: '20px', backgroundColor: '#ffc107' }}>打虎日记-支付倍数计算器</button>
      </div>
      <h3>用户模块管理</h3>
      {loading ? <p>加载中...</p> : (
        <>
          <select onChange={(e) => handleUserSelect(users.find(user => user.id === e.target.value))}>
            <option value="">选择用户</option>
            {users.map(user => (
              <option key={user.id} value={user.id}>{user.username}</option>
            ))}
          </select>
          {selectedUser && (
            <div>
              {Object.entries(allModules).map(([module, label]) => (
                <div key={module}>
                  <label>
                    <input
                      type="checkbox"
                      checked={allowedModules.includes(module)}
                      onChange={(e) => handleModuleChange(module, e.target.checked)}
                    />
                    {label}
                  </label>
                </div>
              ))}
              <button type="button" onClick={handleSaveModules}>保存模块</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default AdminPage;
