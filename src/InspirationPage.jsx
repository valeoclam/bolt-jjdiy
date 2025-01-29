import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import imageCompression from 'browser-image-compression';
import supabase from './supabaseClient';

function InspirationPage({ loggedInUser, supabase, onLogout }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('未执行');
  const [inspirations, setInspirations] = useState([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [editingInspiration, setEditingInspiration] = useState(null);
  const [inspirationPhotos, setInspirationPhotos] = useState([]);
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [tempInspirationPhotos, setTempInspirationPhotos] = useState([]);
  const MAX_PHOTOS = 12;
  const successTimeoutRef = useRef(null);
  const [strikeThroughStates, setStrikeThroughStates] = useState({});

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
        const initialStrikeThroughStates = data.reduce((acc, inspiration) => {
          acc[inspiration.id] = inspiration.strike_through_states || {};
          return acc;
        }, {});
        setStrikeThroughStates(initialStrikeThroughStates);
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

    if (!title) {
      setErrorMessage('标题是必需的。');
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
        .insert([{ user_id: userData.id, title, description, status, photos: tempInspirationPhotos }]);

      if (error) {
        console.error('添加灵感记录时发生错误:', error);
        setErrorMessage('添加灵感记录失败，请重试。' + error.message);
      } else {
        console.log('灵感记录添加成功:', data);
        setSuccessMessage('灵感记录添加成功!');
        setTitle('');
        setDescription('');
        setStatus('未执行');
        setInspirationPhotos([]);
        setTempInspirationPhotos([]);
        fetchInspirations();
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        if (successTimeoutRef.current) {
          clearTimeout(successTimeoutRef.current);
        }
        successTimeoutRef.current = setTimeout(() => setSuccessMessage(''), 3000);
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
    setInspirationPhotos(inspiration.photos || []);
    setTempInspirationPhotos(inspiration.photos || []);
  };

  const handleUpdate = async (event) => {
    event.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');

    if (!title) {
      setErrorMessage('标题是必需的。');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_inspirations')
        .update({ title, description, status, photos: tempInspirationPhotos, updated_at: new Date().toISOString() })
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
        setInspirationPhotos([]);
        setTempInspirationPhotos([]);
        setEditingInspiration(null);
        fetchInspirations();
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        if (successTimeoutRef.current) {
          clearTimeout(successTimeoutRef.current);
        }
        successTimeoutRef.current = setTimeout(() => setSuccessMessage(''), 3000);
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
          if (successTimeoutRef.current) {
            clearTimeout(successTimeoutRef.current);
          }
          successTimeoutRef.current = setTimeout(() => setSuccessMessage(''), 3000);
        }
      } catch (error) {
        console.error('发生意外错误:', error);
        setErrorMessage('发生意外错误。');
      }
    }
  };

  const handleBackToModules = () => {
    navigate('/modules');
  };

  const handleViewHistory = () => {
    navigate('/inspiration/history');
  };

  const renderDescription = (text, inspirationId) => {
    const lines = text.split('\n');
    const listRegex = /^(\d+)\.\s+(.*)$/;
    let inList = false;
    let listItems = [];
    const rendered = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const match = line.match(listRegex);
      if (match) {
        if (!inList) {
          inList = true;
          listItems = [];
        }
        listItems.push(<li key={match[1]}>{match[2]}</li>);
      } else {
        if (inList) {
          inList = false;
          rendered.push(<ol key={rendered.length}>{listItems}</ol>);
          listItems = [];
        }
        const isStrikeThrough = strikeThroughStates[inspirationId] && strikeThroughStates[inspirationId][i] || false;
        rendered.push(
          <p key={i}>
            <span style={{ textDecoration: isStrikeThrough ? 'line-through' : 'none' }}>{line}</span>
          </p>
        );
      }
    }
    if (inList) {
      rendered.push(<ol key={rendered.length}>{listItems}</ol>);
    }
    return rendered;
  };

  const handleInspirationPhotosChange = async (e) => {
    setErrorMessage('');
    const files = Array.from(e.target.files);
    if (!files || files.length === 0) return;
     if (tempInspirationPhotos.length + files.length > MAX_PHOTOS) {
      setErrorMessage(`最多只能添加 ${MAX_PHOTOS} 张照片。`);
      return;
    }

    try {
      const compressedFiles = await Promise.all(
        files.map(async (file) => {
          return await imageCompression(file, {
            maxSizeMB: 1,
            maxWidthOrHeight: 1920,
            useWebWorker: true,
          });
        }),
      );

      const readers = compressedFiles.map((file) => {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            resolve(reader.result);
          };
          reader.readAsDataURL(file);
        });
      });

      const results = await Promise.all(readers);
      setTempInspirationPhotos((prevPhotos) => [...prevPhotos, ...results]);
    } catch (error) {
      console.error('图片压缩失败:', error);
      setErrorMessage('图片压缩失败，请重试。');
    }
  };

  const handleRemoveInspirationPhoto = (indexToRemove) => {
    setTempInspirationPhotos((prevPhotos) =>
      prevPhotos.filter((_, index) => index !== indexToRemove),
    );
  };

  return (
    <div className="container">
      <h2>灵感随记</h2>
      {loggedInUser && <p>当前用户: {loggedInUser.username}</p>}
      <button type="button" onClick={onLogout} className="logout-button">退出</button>
      <button type="button" onClick={handleViewHistory} style={{ marginTop: '20px', backgroundColor: '#28a745' }}>查看灵感集中营</button>
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
        <div className="form-group">
          <div className="file-input-container">
            <input
              type="file"
              id="inspirationPhotos"
              accept="image/*"
              multiple
              onChange={handleInspirationPhotosChange}
              ref={fileInputRef}
              style={{ display: 'none' }}
            />
            <button type="button" onClick={() => fileInputRef.current.click()} className="select-file-button" style={{ backgroundColor: '#28a745' }}>选择照片</button>
            {Array.isArray(tempInspirationPhotos) &&
              tempInspirationPhotos.map((photo, index) => (
                <div key={index} style={{ position: 'relative', display: 'inline-block', marginRight: '5px', marginBottom: '5px' }}>
                  <img src={photo} alt={`Inspiration ${index + 1}`} style={{ maxWidth: '100%', maxHeight: '150px', display: 'block', objectFit: 'contain' }} />
                  <button
                    type="button"
                    onClick={() => handleRemoveInspirationPhoto(index)}
                    style={{
                      position: 'absolute',
                      top: '5px',
                      right: '5px',
                      background: 'rgba(0, 0, 0, 0.5)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '50%',
                      width: '20px',
                      height: '20px',
                      fontSize: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    x
                  </button>
                </div>
              ))}
          </div>
        </div>
        <button type="submit">{editingInspiration ? '更新灵感' : '添加灵感'}</button>
        {editingInspiration && <button type="button" onClick={() => { setEditingInspiration(null); setTitle(''); setDescription(''); setStatus('未执行'); setInspirationPhotos([]); setTempInspirationPhotos([]); }} style={{ marginTop: '10px', backgroundColor: '#6c757d' }}>取消编辑</button>}
      </form>
      {successMessage && <p className="success-message">{successMessage}</p>}
      {errorMessage && <p className="error-message">{errorMessage}</p>}

      <div className="inspiration-list">
        <h3>最近的灵感</h3>
         {inspirations.map((inspiration) => (
          <div key={inspiration.id} className="inspiration-item">
            <h4>{inspiration.title}</h4>
            <div>{renderDescription(inspiration.description, inspiration.id)}</div>
            <p>状态: {inspiration.status}</p>
            <p>创建时间: {new Date(inspiration.created_at).toLocaleString()}</p>
            <p>最后修改时间: {new Date(inspiration.updated_at).toLocaleString()}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap' }}>
              {Array.isArray(inspiration.photos) &&
                inspiration.photos.map((photo, index) => (
                  <img key={index} src={photo} alt={`Inspiration ${index + 1}`} style={{ maxWidth: '100%', maxHeight: '150px', display: 'block', objectFit: 'contain', marginRight: '5px', marginBottom: '5px' }} />
                ))}
            </div>
          </div>
        ))}
      </div>
      <button type="button" onClick={handleBackToModules} style={{ marginTop: '10px', backgroundColor: '#6c757d' }}>返回神奇百宝箱</button>
    </div>
  );
}

export default InspirationPage;
