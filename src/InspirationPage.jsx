import React, { useState, useEffect } from 'react';
    import { useNavigate } from 'react-router-dom';

    function InspirationPage({ loggedInUser, supabase, onLogout }) {
      const [title, setTitle] = useState('');
      const [description, setDescription] = useState('');
      const [status, setStatus] = useState('未执行');
      const [inspirations, setInspirations] = useState([]);
      const [successMessage, setSuccessMessage] = useState('');
      const [errorMessage, setErrorMessage] = useState('');
      const [editingInspiration, setEditingInspiration] = useState(null);
      const navigate = useNavigate();

      useEffect(() => {
        if (loggedInUser) {
          fetchInspirations();
        }
      }, [loggedInUser]);

      const fetchInspirations = async () => {
        try {
          const { data, error } = await supabase
            .from('user_inspirations')
            .select('*')
            .eq('user_id', loggedInUser.id)
            .order('created_at', { ascending: false })
            .limit(3);

          if (error) {
            console.error('获取灵感记录时发生错误:', error);
            setErrorMessage('获取灵感记录失败。');
          } else {
            setInspirations(data.filter(item => item.status !== '已实现'));
          }
        } catch (error) {
          console.error('发生意外错误:', error);
          setErrorMessage('发生意外错误。');
        }
      };

      const handleSubmit = async (event) => {
        event.preventDefault();
        setSuccessMessage('');
        setErrorMessage('');

        if (!title || !description) {
          setErrorMessage('标题和描述是必需的。');
          return;
        }

        try {
          if (!supabase) {
            console.error('Supabase client is not initialized.');
            setErrorMessage('Supabase client is not initialized.');
            return;
          }

          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('id')
            .eq('username', loggedInUser.username)
            .single();

          if (userError) {
            console.error('获取用户ID时发生错误:', userError);
            setErrorMessage('获取用户ID失败，请重试。' + userError.message);
            return;
          }

          if (!userData) {
            console.error('未找到用户');
            setErrorMessage('未找到用户，请重试。');
            return;
          }

          const { data, error } = await supabase
            .from('user_inspirations')
            .insert([{ user_id: userData.id, title, description, status }]);

          if (error) {
            console.error('添加灵感记录时发生错误:', error);
            setErrorMessage('添加灵感记录失败，请重试。' + error.message);
          } else {
            console.log('灵感记录添加成功:', data);
            setSuccessMessage('灵感记录添加成功!');
            setTitle('');
            setDescription('');
            setStatus('未执行');
            fetchInspirations();
          }
        } catch (error) {
          console.error('发生意外错误:', error);
          setErrorMessage('发生意外错误，请重试。' + error.message);
        }
      };

      const handleEdit = (inspiration) => {
        setEditingInspiration(inspiration);
        setTitle(inspiration.title);
        setDescription(inspiration.description);
        setStatus(inspiration.status);
      };

      const handleUpdate = async (event) => {
        event.preventDefault();
        setSuccessMessage('');
        setErrorMessage('');

        if (!title || !description) {
          setErrorMessage('标题和描述是必需的。');
          return;
        }

        try {
          const { data, error } = await supabase
            .from('user_inspirations')
            .update({ title, description, status, updated_at: new Date().toISOString() })
            .eq('id', editingInspiration.id);

          if (error) {
            console.error('更新灵感记录时发生错误:', error);
            setErrorMessage('更新灵感记录失败，请重试。');
          } else {
            console.log('灵感记录更新成功:', data);
            setSuccessMessage('灵感记录更新成功!');
            setTitle('');
            setDescription('');
            setStatus('未执行');
            setEditingInspiration(null);
            fetchInspirations();
          }
        } catch (error) {
          console.error('发生意外错误:', error);
          setErrorMessage('发生意外错误，请重试。');
        }
      };

      const handleDelete = async (inspiration) => {
        if (window.confirm('确定要删除此灵感记录吗？')) {
          try {
            const { data, error } = await supabase
              .from('user_inspirations')
              .delete()
              .eq('id', inspiration.id);

            if (error) {
              console.error('删除灵感记录时发生错误:', error);
              setErrorMessage('删除灵感记录失败，请重试。');
            } else {
              console.log('灵感记录删除成功:', data);
              setSuccessMessage('灵感记录删除成功!');
              fetchInspirations();
            }
          } catch (error) {
            console.error('发生意外错误:', error);
            setErrorMessage('发生意外错误，请重试。');
          }
        }
      };

      const handleBackToModules = () => {
        navigate('/modules');
      };

      const handleViewHistory = () => {
        navigate('/inspiration/history');
      };

      return (
        <div className="container">
          <h2>灵感记录</h2>
          {loggedInUser && <p>当前用户: {loggedInUser.username}</p>}
          <button type="button" onClick={onLogout} className="logout-button">退出</button>
          <form onSubmit={editingInspiration ? handleUpdate : handleSubmit}>
            <div className="form-group">
              <label htmlFor="title">标题:</label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="description">描述:</label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="status">状态:</label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="未执行">未执行</option>
                <option value="执行中">执行中</option>
                <option value="已实现">已实现</option>
              </select>
            </div>
            <button type="submit">{editingInspiration ? '更新灵感' : '添加灵感'}</button>
            {editingInspiration && <button type="button" onClick={() => { setEditingInspiration(null); setTitle(''); setDescription(''); setStatus('未执行'); }} style={{ marginTop: '10px', backgroundColor: '#6c757d' }}>取消编辑</button>}
          </form>
          {successMessage && <p className="success-message">{successMessage}</p>}
          {errorMessage && <p className="error-message">{errorMessage}</p>}

          <div className="inspiration-list">
            <h3>最近的灵感</h3>
            {inspirations.map((inspiration) => (
              <div key={inspiration.id} className="inspiration-item">
                <h4>{inspiration.title}</h4>
                <p>{inspiration.description}</p>
                <p>状态: {inspiration.status}</p>
                <p>创建时间: {new Date(inspiration.created_at).toLocaleString()}</p>
                <p>最后修改时间: {new Date(inspiration.updated_at).toLocaleString()}</p>
                <div className="edit-buttons">
                  <button onClick={() => handleEdit(inspiration)}>编辑</button>
                  <button onClick={() => handleDelete(inspiration)}>删除</button>
                </div>
              </div>
            ))}
          </div>
          <button type="button" onClick={handleViewHistory} style={{ marginTop: '20px', backgroundColor: '#28a745' }}>查看历史记录</button>
          <button type="button" onClick={handleBackToModules} style={{ marginTop: '10px', backgroundColor: '#6c757d' }}>返回模块选择</button>
        </div>
      );
    }

    export default InspirationPage;
