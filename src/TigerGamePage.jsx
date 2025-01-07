import React, { useState, useRef, useEffect } from 'react';
    import { v4 as uuidv4 } from 'uuid';
    import * as EXIF from 'exifreader';
    import imageCompression from 'browser-image-compression';
    import { Link, useNavigate } from 'react-router-dom';
    import { createClient } from '@supabase/supabase-js';

    const supabaseUrl = 'https://fhcsffagxchzpxouuiuq.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZoY3NmZmFneGNoenB4b3V1aXVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzYyMTQzMzAsImV4cCI6MjA1MTc5MDMzMH0.1DMl870gjGRq5LRlQMES9WpYWehiKiPIea2Yj1q4Pz8';
    const supabase = createClient(supabaseUrl, supabaseKey);

    function Tracker({ loggedInUser, onLogout }) {
      const [inputAmount, setInputAmount] = useState('');
      const [cashOutAmount, setCashOutAmount] = useState('');
      const [mainPhoto, setMainPhoto] = useState(null);
      const [winningPhotos, setWinningPhotos] = useState([]);
      const [logs, setLogs] = useState([]);
      const [errorMessage, setErrorMessage] = useState('');
      const [successMessage, setSuccessMessage] = useState('');
      const [loading, setLoading] = useState(false);
      const navigate = useNavigate();
      const fileInputRef = useRef(null);
      const winningFileInputRef = useRef(null);

      useEffect(() => {
        if (loggedInUser) {
          setLoading(true);
          fetchLogs();
        }
      }, [loggedInUser]);

      const fetchLogs = async () => {
        try {
          let query = supabase
            .from('tiger_game_logs')
            .select('*')
            .eq('user_id', loggedInUser.id)
            .order('created_at', { ascending: false });

          const { data, error } = await query;

          if (error) {
            console.error('获取打老虎记录时发生错误:', error);
            setErrorMessage('获取打老虎记录失败。');
          } else {
            setLogs(data);
          }
        } catch (error) {
          console.error('发生意外错误:', error);
          setErrorMessage('发生意外错误。');
        } finally {
          setLoading(false);
        }
      };

      const handleMainPhotoChange = async (e) => {
        setErrorMessage('');
        const file = e.target.files[0];
        if (!file) return;

        try {
          const compressedFile = await imageCompression(file, {
            maxSizeMB: 1,
            maxWidthOrHeight: 1920,
            useWebWorker: true,
          });

          const reader = new FileReader();
          reader.onloadend = () => {
            setMainPhoto(reader.result);
          };
          reader.readAsDataURL(compressedFile);
        } catch (error) {
          console.error('图片压缩失败:', error);
          setErrorMessage('图片压缩失败，请重试。');
        }
      };

      const handleWinningPhotosChange = async (e) => {
        setErrorMessage('');
        const files = Array.from(e.target.files);
        if (!files || files.length === 0) return;

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
          setWinningPhotos(results);
        } catch (error) {
          console.error('图片压缩失败:', error);
          setErrorMessage('图片压缩失败，请重试。');
        }
      };

      const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage('');
        if (!mainPhoto) {
          setErrorMessage('请先拍摄或上传照片');
          return;
        }

        if (loading) {
          console.log('User data is still loading, please wait.');
          return;
        }

        const newLog = {
          id: uuidv4(),
          user_id: loggedInUser.id,
          input_amount: parseFloat(inputAmount),
          cash_out_amount: parseFloat(cashOutAmount),
          main_photo: mainPhoto,
          winning_photos: winningPhotos,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        try {
          const { data, error } = await supabase
            .from('tiger_game_logs')
            .insert([newLog]);

          if (error) {
            console.error('添加打老虎记录时发生错误:', error);
            setErrorMessage('添加打老虎记录失败，请重试: ' + error.message);
             setLogs((prevLogs) => [...prevLogs, {...newLog}]);
          } else {
            console.log('打老虎记录添加成功:', data);
            // Check if data is not null and has at least one element
            if (data && data.length > 0 && data[0].id) {
              setLogs((prevLogs) => [...prevLogs, { ...newLog, id: data[0].id }]);
            } else {
              setLogs((prevLogs) => [...prevLogs, {...newLog}]);
            }
            setSuccessMessage('打老虎记录添加成功!');
            setInputAmount('');
            setCashOutAmount('');
            setMainPhoto(null);
            setWinningPhotos([]);
            if (fileInputRef.current) {
              fileInputRef.current.value = '';
            }
            if (winningFileInputRef.current) {
              winningFileInputRef.current.value = '';
            }
          }
        } catch (error) {
          console.error('发生意外错误:', error);
          setErrorMessage('发生意外错误，请重试: ' + error.message);
           setLogs((prevLogs) => [...prevLogs, {...newLog}]);
        }
      };

      const handleBackToModules = () => {
        navigate('/modules');
      };

      const handleViewHistory = () => {
        navigate('/tiger-game/history');
      };

      return (
        <div className="container">
          <h2>打老虎</h2>
          {loggedInUser && <p>当前用户: {loggedInUser.username}</p>}
          <button type="button" onClick={onLogout} className="logout-button">退出</button>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="inputAmount">投入金额:</label>
              <input
                type="number"
                id="inputAmount"
                value={inputAmount}
                onChange={(e) => setInputAmount(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="cashOutAmount">兑换金额:</label>
              <input
                type="number"
                id="cashOutAmount"
                value={cashOutAmount}
                onChange={(e) => setCashOutAmount(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="mainPhoto">主要照片:</label>
              <input
                type="file"
                id="mainPhoto"
                accept="image/*"
                onChange={handleMainPhotoChange}
                ref={fileInputRef}
              />
              {mainPhoto && <img src={mainPhoto} alt="Main" style={{ maxWidth: '100%', marginTop: '10px', maxHeight: '300px', display: 'block', objectFit: 'contain' }} />}
            </div>
            <div className="form-group">
              <label htmlFor="winningPhotos">中奖照片:</label>
              <input
                type="file"
                id="winningPhotos"
                accept="image/*"
                multiple
                onChange={handleWinningPhotosChange}
                ref={winningFileInputRef}
              />
              {winningPhotos &&
                winningPhotos.map((photo, index) => (
                  <img key={index} src={photo} alt={`Winning ${index + 1}`} style={{ maxWidth: '100%', marginTop: '10px', maxHeight: '300px', display: 'block', objectFit: 'contain' }} />
                ))}
            </div>
            <button type="submit" disabled={loading}>
              {loading ? '正在保存...' : '添加记录'}
            </button>
          </form>
          {successMessage && <p className="success-message">{successMessage}</p>}
          {errorMessage && <p className="error-message">{errorMessage}</p>}
          <button type="button" onClick={handleViewHistory} style={{ marginTop: '20px', backgroundColor: '#28a745' }}>查看历史记录</button>
          <button type="button" onClick={handleBackToModules} style={{ marginTop: '10px', backgroundColor: '#6c757d' }}>返回模块选择</button>
        </div>
      );
    }

    export default Tracker;
