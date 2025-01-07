import React, { useState, useEffect } from 'react';
    import { useNavigate } from 'react-router-dom';

    function HistoryPage({ loggedInUser, supabase, onLogout }) {
      const [inspirations, setInspirations] = useState([]);
      const [errorMessage, setErrorMessage] = useState('');
      const [searchKeyword, setSearchKeyword] = useState('');
      const [searchStatus, setSearchStatus] = useState('');
      const [editingInspiration, setEditingInspiration] = useState(null);
      const [title, setTitle] = useState('');
      const [description, setDescription] = useState('');
      const [status, setStatus] = useState('未执行');
      const navigate = useNavigate();

      useEffect(() => {
        if (loggedInUser) {
          fetchInspirations();
        }
      }, [loggedInUser, searchKeyword, searchStatus]);

      const fetchInspirations = async () => {
        try {
          let query = supabase
            .from('user_inspirations')
            .select('*')
            .eq('user_id', loggedInUser.id)
            .order('created_at', { ascending: false });

          if (searchKeyword) {
            query = query.ilike('title', `%${searchKeyword}%`);
          }

          if (searchStatus) {
            query = query.eq('status', searchStatus);
          }

          const { data, error } = await query;

          if (error) {
            console.error('获取灵感记录时发生错误:', error);
            setErrorMessage('获取灵感记录失败。');
          } else {
            setInspirations(data);
          }
        } catch (error) {
          console.error('发生意外错误:', error);
          setErrorMessage('发生意外错误。');
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

      return (
        <div className="container">
          <h2>历史记录</h2>
          {loggedInUser && <p>当前用户: {loggedInUser.username}</p>}
          <button type="button" onClick={onLogout} className="logout-button">退出</button>

          <div className="search-container">
            <input
              type="text"
              placeholder="搜索标题"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
            />
            <select
              value={searchStatus}
              onChange={(e) => setSearchStatus(e.target.value)}
            >
              <option value="">所有状态</option>
              <option value="未执行">未执行</option>
              <option value="执行中">执行中</option>
              <option value="已实现">已实现</option>
            </select>
          </div>

          {errorMessage && <p className="error-message">{errorMessage}</p>}

          <div className="inspiration-list">
            <h3>所有灵感记录</h3>
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
                {editingInspiration && editingInspiration.id === inspiration.id && (
                  <form onSubmit={handleUpdate}>
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
                    <button type="submit">更新灵感</button>
                    <button type="button" onClick={() => { setEditingInspiration(null); setTitle(''); setDescription(''); setStatus('未执行'); }} style={{ marginTop: '10px', backgroundColor: '#6c757d' }}>取消编辑</button>
                  </form>
                )}
              </div>
            ))}
          </div>
          <button type="button" onClick={handleBackToModules} style={{ marginTop: '20px', backgroundColor: '#28a745' }}>返回模块选择</button>
        </div>
      );
    }

    export default HistoryPage;
