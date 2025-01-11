import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fhcsffagxchzpxouuiuq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZoY3NmZmFneGNoenB4b3V1aXVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzYyMTQzMzAsImV4cCI6MjA1MTc5MDMzMH0.1DMl870gjGRq5LRlQMES9WpYWehiKiPIea2Yj1q4Pz8';
const supabase = createClient(supabaseUrl, supabaseKey);

function AdminPage({ loggedInUser, onLogout }) {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [allowedModules, setAllowedModules] = useState([]);
  const allModules = ['inspiration', 'tiger-game', 'lazy-diary'];

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

  return (
    <div className="container">
      <h2>后台管理</h2>
      {loggedInUser && <p>当前用户: {loggedInUser.username}</p>}
      <button type="button" onClick={onLogout} className="logout-button">退出</button>
      <div className="module-list" style={{ width: '100%', maxWidth: '400px' }}>
        <button type="button" onClick={handleEditQuestionsClick} className="module-button edit-questions-button" style={{ padding: '20px', fontSize: '20px', backgroundColor: '#007bff' }}>懒人日记-问题库管理</button>
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
              {allModules.map(module => (
                <div key={module}>
                  <label>
                    <input
                      type="checkbox"
                      checked={allowedModules.includes(module)}
                      onChange={(e) => handleModuleChange(module, e.target.checked)}
                    />
                    {module}
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
