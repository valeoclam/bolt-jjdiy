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
  const [attempts, setAttempts] = useState('');
  const [encounteredTrailer, setEncounteredTrailer] = useState(false);
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const winningFileInputRef = useRef(null);
  const [betAmount, setBetAmount] = useState('');
  const [prizeAmount, setPrizeAmount] = useState('');
  const [activeInput, setActiveInput] = useState(null);
  const [showKeyboard, setShowKeyboard] = useState(false);
  const keyboardRef = useRef(null);
  const inputRef = useRef(null);
  const [keyboardPosition, setKeyboardPosition] = useState({ top: 0, left: 0 });
  const keyboardOffset = 5;
  const successTimeoutRef = useRef(null);

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
      setWinningPhotos((prevPhotos) => [...prevPhotos, ...results]);
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
      attempts: parseInt(attempts, 10) || 0,
      encountered_trailer: encounteredTrailer,
      bet_amount: parseFloat(betAmount),
      prize_amount: parseFloat(prizeAmount),
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
        setAttempts('');
        setEncounteredTrailer(false);
        setBetAmount('');
        setPrizeAmount('');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        if (winningFileInputRef.current) {
          winningFileInputRef.current.value = '';
        }
        if (successTimeoutRef.current) {
          clearTimeout(successTimeoutRef.current);
        }
        successTimeoutRef.current = setTimeout(() => setSuccessMessage(''), 3000);
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

  const handleRemoveWinningPhoto = (indexToRemove) => {
    setWinningPhotos((prevPhotos) =>
      prevPhotos.filter((_, index) => index !== indexToRemove),
    );
  };

  const handleNumberClick = (number) => {
    if (activeInput === 'inputAmount') {
      setInputAmount(prev => prev + number);
    } else if (activeInput === 'betAmount') {
      setBetAmount(prev => prev + number);
    } else if (activeInput === 'prizeAmount') {
      setPrizeAmount(prev => prev + number);
    } else if (activeInput === 'cashOutAmount') {
      setCashOutAmount(prev => prev + number);
    } else if (activeInput === 'attempts') {
      setAttempts(prev => prev + number);
    }
  };

  const handleBackspaceClick = () => {
    if (activeInput === 'inputAmount') {
      setInputAmount(prev => prev.slice(0, -1));
    } else if (activeInput === 'betAmount') {
      setBetAmount(prev => prev.slice(0, -1));
    } else if (activeInput === 'prizeAmount') {
      setPrizeAmount(prev => prev.slice(0, -1));
    } else if (activeInput === 'cashOutAmount') {
      setCashOutAmount(prev => prev.slice(0, -1));
    } else if (activeInput === 'attempts') {
      setAttempts(prev => prev.slice(0, -1));
    }
  };

    const handleClearClick = () => {
        if (activeInput === 'inputAmount') {
            setInputAmount('');
        } else if (activeInput === 'betAmount') {
            setBetAmount('');
        } else if (activeInput === 'prizeAmount') {
            setPrizeAmount('');
        } else if (activeInput === 'cashOutAmount') {
            setCashOutAmount('');
        } else if (activeInput === 'attempts') {
            setAttempts('');
        }
    };

  const handleDecimalClick = () => {
    if (activeInput === 'inputAmount' && !inputAmount.includes('.')) {
      setInputAmount(prev => prev + '.');
    } else if (activeInput === 'betAmount' && !betAmount.includes('.')) {
      setBetAmount(prev => prev + '.');
    } else if (activeInput === 'prizeAmount' && !prizeAmount.includes('.')) {
      setPrizeAmount(prev => prev + '.');
    } else if (activeInput === 'cashOutAmount' && !cashOutAmount.includes('.')) {
      setCashOutAmount(prev => prev + '.');
    }
  };

  const toggleKeyboard = (inputField, inputElement) => {
    setActiveInput(inputField);
    setShowKeyboard(true);
    if (inputElement) {
      const inputRect = inputElement.getBoundingClientRect();
       const containerRect = document.querySelector('.container').getBoundingClientRect();
      setKeyboardPosition({
        top: inputRect.bottom - containerRect.top + keyboardOffset,
        left: inputRect.left - containerRect.left,
      });
    }
  };

  const handleInputFocus = (inputField, inputElement) => {
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      inputElement.blur();
    }
    toggleKeyboard(inputField, inputElement);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (keyboardRef.current && !keyboardRef.current.contains(event.target) &&
          inputRef.current && !inputRef.current.contains(event.target)) {
        setShowKeyboard(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="container">
      <h2>打虎日记</h2>
      {loggedInUser && <p>当前用户: {loggedInUser.username}</p>}
      <button type="button" onClick={onLogout} className="logout-button">退出</button>
      <button type="button" onClick={handleViewHistory} style={{ marginTop: '20px', backgroundColor: '#28a745' }}>查看打过的老虎们</button>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <div className="file-input-container" style={{ marginTop: '20px' }}>
            <input
              type="file"
              id="mainPhoto"
              accept="image/*"
              onChange={handleMainPhotoChange}
              ref={fileInputRef}
              style={{ display: 'none' }}
            />
            <button type="button" onClick={() => fileInputRef.current.click()} className="select-file-button" style={{ marginTop: '0px' }}>开始打老虎</button>
            {mainPhoto && <img src={mainPhoto} alt="Main" style={{ maxWidth: '100%', marginTop: '10px', maxHeight: '300px', display: 'block', objectFit: 'contain' }} />}
          </div>
        </div>
        <div className="form-group">
          <label htmlFor="inputAmount">投入金额:</label>
          <input
            type="number"
            id="inputAmount"
            value={inputAmount}
            onChange={(e) => setInputAmount(e.target.value)}
            onFocus={(e) => handleInputFocus('inputAmount', e.target)}
            ref={inputRef}
            required
          />
        </div>
         <div className="form-group">
          <label htmlFor="betAmount">下注金额:</label>
          <input
            type="number"
            id="betAmount"
            value={betAmount}
            onChange={(e) => setBetAmount(e.target.value)}
            onFocus={(e) => handleInputFocus('betAmount', e.target)}
            ref={inputRef}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="prizeAmount">中奖金额:</label>
          <input
            type="number"
            id="prizeAmount"
            value={prizeAmount}
            onChange={(e) => setPrizeAmount(e.target.value)}
            onFocus={(e) => handleInputFocus('prizeAmount', e.target)}
            ref={inputRef}
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
            onFocus={(e) => handleInputFocus('cashOutAmount', e.target)}
            ref={inputRef}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="attempts">尝试次数:</label>
          <input
            type="number"
            id="attempts"
            value={attempts}
            onChange={(e) => setAttempts(e.target.value)}
            onFocus={(e) => handleInputFocus('attempts', e.target)}
            ref={inputRef}
            required
          />
        </div>
        <div className="form-group">
          <label>
            遇到预告片:
            <input
              type="radio"
              name="encounteredTrailer"
              checked={encounteredTrailer}
              onChange={() => setEncounteredTrailer(true)}
            />
            是
            <input
              type="radio"
              name="encounteredTrailer"
              checked={!encounteredTrailer}
              onChange={() => setEncounteredTrailer(false)}
            />
            否
          </label>
        </div>
        <div className="form-group">
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
            {Array.isArray(winningPhotos) &&
              winningPhotos.map((photo, index) => (
                <div key={index} style={{ position: 'relative', display: 'inline-block', marginRight: '5px', marginBottom: '5px' }}>
                  <img src={photo} alt={`Winning ${index + 1}`} style={{ maxWidth: '100%', marginTop: '10px', maxHeight: '300px', display: 'block', objectFit: 'contain' }} />
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
        <button type="submit" disabled={loading}>
          {loading ? '正在保存...' : '添加记录'}
        </button>
      </form>
      {successMessage && <p className="success-message">{successMessage}</p>}
      {errorMessage && <p className="error-message">{errorMessage}</p>}
      {showKeyboard && (
        <div className="numeric-keyboard" ref={keyboardRef} style={{
          position: 'absolute',
          top: keyboardPosition.top,
          left: keyboardPosition.left,
          zIndex: 1000,
          backgroundColor: '#f0f0f0',
          border: '1px solid #ddd',
          borderRadius: '8px',
          padding: '5px',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '5px',
        }}>
          <div className="keyboard-row">
            <button type="button" onClick={() => handleNumberClick('1')} className="keyboard-button">1</button>
            <button type="button" onClick={() => handleNumberClick('2')} className="keyboard-button">2</button>
            <button type="button" onClick={() => handleNumberClick('3')} className="keyboard-button">3</button>
             <button type="button" onClick={handleClearClick} className="keyboard-button clear-button">C</button>
          </div>
          <div className="keyboard-row">
            <button type="button" onClick={() => handleNumberClick('4')} className="keyboard-button">4</button>
            <button type="button" onClick={() => handleNumberClick('5')} className="keyboard-button">5</button>
            <button type="button" onClick={() => handleNumberClick('6')} className="keyboard-button">6</button>
            <button type="button" onClick={handleBackspaceClick} className="keyboard-button">&#8592;</button>
          </div>
          <div className="keyboard-row">
            <button type="button" onClick={() => handleNumberClick('7')} className="keyboard-button">7</button>
            <button type="button" onClick={() => handleNumberClick('8')} className="keyboard-button">8</button>
            <button type="button" onClick={() => handleNumberClick('9')} className="keyboard-button">9</button>
            <button type="button" onClick={() => handleNumberClick('0')} className="keyboard-button">0</button>
          </div>
           <div className="keyboard-row">
            <button type="button" onClick={handleDecimalClick} className="keyboard-button">.</button>
          </div>
        </div>
      )}
      <button type="button" onClick={handleBackToModules} style={{ marginTop: '10px', backgroundColor: '#6c757d' }}>返回神奇百宝箱</button>
    </div>
  );
}

export default Tracker;