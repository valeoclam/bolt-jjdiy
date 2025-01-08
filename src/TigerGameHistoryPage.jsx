import React, { useState, useEffect, useRef } from 'react';
    import { Link, useNavigate } from 'react-router-dom';
    import { createClient } from '@supabase/supabase-js';
    import imageCompression from 'browser-image-compression';

    const supabaseUrl = 'https://fhcsffagxchzpxouuiuq.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZoY3NmZmFneGNoenB4b3V1aXVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzYyMTQzMzAsImV4cCI6MjA1MTc5MDMzMH0.1DMl870gjGRq5LRlQMES9WpYWehiKiPIea2Yj1q4Pz8';
    const supabase = createClient(supabaseUrl, supabaseKey);

    function TigerGameHistory({ loggedInUser, onLogout }) {
      const [logs, setLogs] = useState([]);
      const [startDate, setStartDate] = useState('');
      const [endDate, setEndDate] = useState('');
      const [sortedLogs, setSortedLogs] = useState([]);
      const [sortByProfit, setSortByProfit] = useState(false);
      const [sortByAttempts, setSortByAttempts] = useState(false);
      const [editingLogId, setEditingLogId] = useState(null);
      const [inputAmount, setInputAmount] = useState('');
      const [cashOutAmount, setCashOutAmount] = useState('');
      const [mainPhoto, setMainPhoto] = useState(null);
      const [winningPhotos, setWinningPhotos] = useState([]);
      const [addTime, setAddTime] = useState(null);
      const [modifyTime, setModifyTime] = useState(null);
      const [confirmDeleteId, setConfirmDeleteId] = useState(null);
      const navigate = useNavigate();
      const [errorMessage, setErrorMessage] = useState('');
      const winningFileInputRef = useRef(null);
      const [tempWinningPhotos, setTempWinningPhotos] = useState([]);
      const [attempts, setAttempts] = useState('');

      useEffect(() => {
        if (loggedInUser) {
          fetchLogs();
        }
      }, [loggedInUser]);

      useEffect(() => {
        setSortedLogs([...logs].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
      }, [logs]);

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
        }
      };

      const calculateTotalProfit = () => {
        const filteredLogs = logs.filter((log) => {
          const logTime = new Date(log.created_at).getTime();
          const startTime = startDate ? new Date(startDate).getTime() : 0;
          const endTime = endDate ? new Date(endDate).getTime() : Infinity;
          return logTime >= startTime && logTime <= endTime;
        });
        return filteredLogs.reduce(
          (total, log) => total + (log.cash_out_amount - log.input_amount),
          0,
        );
      };

      const calculateAverageAttempts = () => {
        const filteredLogs = logs.filter((log) => {
          const logTime = new Date(log.created_at).getTime();
          const startTime = startDate ? new Date(startDate).getTime() : 0;
          const endTime = endDate ? new Date(endDate).getTime() : Infinity;
          return logTime >= startTime && logTime <= endTime;
        });
        if (filteredLogs.length === 0) return 0;
        const totalAttempts = filteredLogs.reduce((sum, log) => sum + log.attempts, 0);
        return (totalAttempts / filteredLogs.length).toFixed(2);
      };

      const handleSortByProfit = () => {
        setSortByProfit(!sortByProfit);
        setSortedLogs((prevLogs) => {
          const sorted = [...prevLogs].sort((a, b) =>
            sortByProfit
              ? (a.cash_out_amount - a.input_amount) -
                (b.cash_out_amount - b.input_amount)
              : (b.cash_out_amount - a.input_amount) -
                (a.cash_out_amount - a.input_amount),
          );
          return sorted;
        });
      };

      const handleSortByAttempts = () => {
        setSortByAttempts(!sortByAttempts);
        setSortedLogs((prevLogs) => {
          const sorted = [...prevLogs].sort((a, b) =>
            sortByAttempts ? a.attempts - b.attempts : b.attempts - a.attempts,
          );
          return sorted;
        });
      };

      const handleEditLog = (log) => {
        setEditingLogId(log.id);
        setInputAmount(log.input_amount);
        setCashOutAmount(log.cash_out_amount);
        setMainPhoto(log.main_photo);
        setWinningPhotos(() => log.winning_photos);
        setTempWinningPhotos(log.winning_photos || []);
        setAddTime(log.created_at);
        setModifyTime(log.updated_at);
        setAttempts(log.attempts);
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
          setTempWinningPhotos((prevPhotos) => [...prevPhotos, ...results]);
        } catch (error) {
          console.error('图片压缩失败:', error);
          setErrorMessage('图片压缩失败，请重试。');
        }
      };

      const handleUpdateLog = async (e) => {
        e.preventDefault();
        setErrorMessage('');
        const updatedLog = {
          input_amount: parseFloat(inputAmount),
          cash_out_amount: parseFloat(cashOutAmount),
          main_photo: mainPhoto,
          winning_photos: tempWinningPhotos,
          updated_at: new Date().toISOString(),
          attempts: parseInt(attempts, 10) || 0,
        };
        try {
          const { data, error } = await supabase
            .from('tiger_game_logs')
            .update(updatedLog)
            .eq('id', editingLogId);

          if (error) {
            console.error('更新打老虎记录时发生错误:', error);
            setErrorMessage('更新打老虎记录失败，请重试。');
          } else {
            console.log('打老虎记录更新成功:', data);
            setLogs((prevLogs) =>
              prevLogs.map((log) => (log.id === editingLogId ? { ...log, ...updatedLog } : log)),
            );
            setEditingLogId(null);
            setInputAmount('');
            setCashOutAmount('');
            setMainPhoto(null);
            setWinningPhotos([]);
            setTempWinningPhotos([]);
            setAddTime(null);
            setModifyTime(null);
            setAttempts('');
            navigate('/tiger-game/history');
          }
        } catch (error) {
          console.error('发生意外错误:', error);
          setErrorMessage('发生意外错误。');
        }
      };

      const handleDeleteLog = async (id) => {
        if (confirmDeleteId === id) {
          try {
            const { data, error } = await supabase
              .from('tiger_game_logs')
              .delete()
              .eq('id', id);

            if (error) {
              console.error('删除打老虎记录时发生错误:', error);
              setErrorMessage('删除打老虎记录失败，请重试。');
            } else {
              console.log('打老虎记录删除成功:', data);
              setLogs((prevLogs) => prevLogs.filter((log) => log.id !== id));
              setConfirmDeleteId(null);
            }
          } catch (error) {
            console.error('发生意外错误:', error);
            setErrorMessage('发生意外错误。');
          }
        } else {
          setConfirmDeleteId(id);
        }
      };

      const handleInputChange = (e) => {
        if (e.target.value !== '') {
          setModifyTime(new Date().toLocaleString());
        }
        if (e.target.type === 'number') {
          if (e.target.id === 'inputAmount') {
            setInputAmount(e.target.value);
          } else if (e.target.id === 'cashOutAmount') {
            setCashOutAmount(e.target.value);
          } else if (e.target.id === 'attempts') {
            setAttempts(e.target.value);
          }
        }
      };

      const handleRemoveWinningPhoto = (indexToRemove) => {
        setTempWinningPhotos((prevPhotos) =>
          prevPhotos.filter((_, index) => index !== indexToRemove),
        );
      };

      const handleBackToModules = () => {
        navigate('/modules');
      };

      return (
        <div className="container">
          <h2>打过的老虎</h2>
          {loggedInUser && <p>当前用户: {loggedInUser.username}</p>}
          <button type="button" onClick={onLogout} className="logout-button">退出</button>
          <button type="button" onClick={() => navigate('/tiger-game')} className="select-file-button" style={{ marginTop: '20px' }}>
            返回添加记录
          </button>
          {errorMessage && <p className="error-message">{errorMessage}</p>}
          <div className="form-group">
            <label>开始时间:</label>
            <input
              type="datetime-local"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>结束时间:</label>
            <input
              type="datetime-local"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <p>
            <strong>盈亏总额:</strong> {calculateTotalProfit()}
          </p>
          <p>
            <strong>平均尝试次数:</strong> {calculateAverageAttempts()}
          </p>
          <div className="sort-buttons">
            <button type="button" onClick={handleSortByProfit} className="sort-button">
              按盈亏金额排序
            </button>
            <button type="button" onClick={handleSortByAttempts} className="sort-button">
              按尝试次数排序
            </button>
          </div>
          {sortedLogs.map((log, index) => (
            <div key={log.id} className="log-item">
              <p>
                <strong>编号:</strong>{' '}
                {logs.length - logs.findIndex((l) => l.id === log.id)}
              </p>
              <p>
                <strong>添加时间:</strong> {new Date(log.created_at).toLocaleString()}
              </p>
              {log.updated_at && (
                <p>
                  <strong>修改时间:</strong> {new Date(log.updated_at).toLocaleString()}
                </p>
              )}
              <p>
                <strong>投入金额:</strong> {log.input_amount}
              </p>
              <p>
                <strong>兑换金额:</strong> {log.cash_out_amount}
              </p>
              <p>
                <strong>盈亏金额:</strong> {log.cash_out_amount - log.input_amount}
              </p>
              <p>
                <strong>尝试次数:</strong> {log.attempts}
              </p>
              {log.main_photo && <img src={log.main_photo} alt="Main Log" style={{ maxWidth: '100%', maxHeight: '300px', display: 'block', objectFit: 'contain' }} />}
              <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                {tempWinningPhotos &&
                  tempWinningPhotos.map((photo, index) => (
                    <div key={index} style={{ position: 'relative', display: 'inline-block', marginRight: '5px', marginBottom: '5px' }}>
                      <img src={photo} alt={`Winning Log ${index + 1}`} style={{ maxWidth: '100%', maxHeight: '150px', display: 'block', objectFit: 'contain' }} />
                      {editingLogId === log.id && (
                        <button
                          type="button"
                          onClick={() => handleRemoveWinningPhoto(index)}
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
                          }}
                        >
                          x
                        </button>
                      )}
                    </div>
                  ))}
              </div>
              <div className="edit-buttons">
                {editingLogId === log.id ? (
                  <form onSubmit={handleUpdateLog} style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <div className="form-group">
                      <label>投入金额:</label>
                      <input
                        type="number"
                        id="inputAmount"
                        value={inputAmount}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>兑换金额:</label>
                      <input
                        type="number"
                        id="cashOutAmount"
                        value={cashOutAmount}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="winningPhotos">老虎送钱了:</label>
                      <div className="file-input-container">
                        <input
                          type="file"
                          id="winningPhotos"
                          accept="image/*"
                          multiple
                          onChange={handleWinningPhotosChange}
                          ref={winningFileInputRef}
                          style={{ display: 'none' }}
                        />
                        <button type="button" onClick={() => winningFileInputRef.current.click()} className="select-file-button" style={{ backgroundColor: '#28a745' }}>老虎送钱了</button>
                      </div>
                    </div>
                    <div className="form-group">
                      <label>尝试次数:</label>
                      <input
                        type="number"
                        id="attempts"
                        value={attempts}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <button type="submit" className="select-file-button">更新</button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingLogId(null);
                        navigate('/tiger-game/history');
                      }}
                      className="select-file-button" style={{ backgroundColor: '#dc3545' }}
                    >
                      取消
                    </button>
                  </form>
                ) : (
                  <>
                    <button
                      className="edit-button"
                      onClick={() => handleEditLog(log)}
                    >
                      编辑
                    </button>
                    <button
                      className="delete-button"
                      onClick={() => handleDeleteLog(log.id)}
                    >
                      {confirmDeleteId === log.id ? '确认删除' : '删除'}
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
          <button type="button" onClick={handleBackToModules} style={{ marginTop: '10px', backgroundColor: '#28a745' }}>返回模块选择</button>
        </div>
      );
    }

    export default TigerGameHistory;
