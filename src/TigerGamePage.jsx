import React, { useState, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import * as EXIF from 'exifreader';
import imageCompression from 'browser-image-compression';
import { Link, useNavigate } from 'react-router-dom';
import supabase from './supabaseClient';

function TigerGamePage({ loggedInUser, onLogout }) {
  const [inputAmount, setInputAmount] = useState('100');
  const [cashOutAmount, setCashOutAmount] = useState('');
  const [mainPhoto, setMainPhoto] = useState(null);
  const [winningPhotos, setWinningPhotos] = useState([]);
  const [logs, setLogs] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState('');
  const [encounteredTrailer, setEncounteredTrailer] = useState(true);
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const winningFileInputRef = useRef(null);
  const [betAmount, setBetAmount] = useState('');
  const [prizeAmount, setPrizeAmount] = useState(0);
  const [activeInput, setActiveInput] = useState(null);
  const [showKeyboard, setShowKeyboard] = useState(false);
  const keyboardRef = useRef(null);
  const inputRef = useRef(null);
  const [keyboardPosition, setKeyboardPosition] = useState({ top: 0, left: 0 });
  const keyboardOffset = 5;
  const successTimeoutRef = useRef(null);
	const betInputRef = useRef(null);
  const prizeInputRef = useRef(null);
  const cashOutInputRef = useRef(null);
  const attemptsInputRef = useRef(null);
  const inputAmountInputRef = useRef(null);
	const [activeInputRef, setActiveInputRef] = useState(null);
	const [gameNames, setGameNames] = useState([]);
	const [gameName, setGameName] = useState(''); // 添加 gameName 状态
	const [isKeyboardEnabled, setIsKeyboardEnabled] = useState(true);


	const fetchGameNames = async () => {
  try {
    const { data, error } = await supabase
      .from('payment_multiplier_logs')
      .select('game_name')
      .eq('user_id', loggedInUser.id);

    if (error) {
      console.error('获取游戏名称列表时发生错误:', error);
    } else {
      // 提取唯一的游戏名称
      const uniqueGameNames = [...new Set(data.map(item => item.game_name))];
      setGameNames(uniqueGameNames);
    }
  } catch (error) {
    console.error('发生意外错误:', error);
  }
};

useEffect(() => {
  if (loggedInUser) {
    fetchGameNames();
  }
}, [loggedInUser]);




  useEffect(() => {
    if (betInputRef.current) {
      betInputRef.current.value = String(betAmount);
    }
  }, [betAmount]);

  useEffect(() => {
    if (prizeInputRef.current) {
      prizeInputRef.current.value = String(prizeAmount);
    }
  }, [prizeAmount]);

  useEffect(() => {
    if (cashOutInputRef.current) {
      cashOutInputRef.current.value = String(cashOutAmount);
    }
  }, [cashOutAmount]);

  useEffect(() => {
    if (attemptsInputRef.current) {
      attemptsInputRef.current.value = String(attempts);
    }
  }, [attempts]);

  useEffect(() => {
    if (inputAmountInputRef.current) {
      inputAmountInputRef.current.value = String(inputAmount);
    }
  }, [inputAmount]);


useEffect(() => {
    // if (loggedInUser) { // REMOVED: 移除初始加载
    //   setLoading(true);
    //   fetchLogs();
    // }
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
        maxSizeMB: 0.5,
        maxWidthOrHeight: 150,
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
            maxSizeMB: 0.5,
            maxWidthOrHeight: 150,
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
    // if (!mainPhoto) { // 移除这部分代码
  //   setErrorMessage('请先拍摄或上传照片');
  //   return;
  // }

    if (loading) {
      console.log('User data is still loading, please wait.');
      return;
    }

		let finalEncounteredTrailer = encounteredTrailer;
    if (parseFloat(prizeAmount) > 0) {
      finalEncounteredTrailer = false;
    }

    const newLog = {
      id: uuidv4(),
      user_id: loggedInUser.id,
			game_name: gameName, // 添加游戏名称
      input_amount: parseFloat(inputAmount),
      cash_out_amount: parseFloat(cashOutAmount),
      main_photo: mainPhoto,
      winning_photos: winningPhotos,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      attempts: parseInt(attempts, 10) || 0,
			encountered_trailer: finalEncounteredTrailer,
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
        setInputAmount('100');
        setCashOutAmount('');
        setMainPhoto(null);
        setWinningPhotos([]);
        setAttempts('');
        setEncounteredTrailer(true);
        setBetAmount('');
        setPrizeAmount('0');
				setGameName(''); // 添加这行代码来清空游戏名称
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

  const handleRemoveMainPhoto = () => {
    setMainPhoto(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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
  if (activeInput === 'inputAmount' && typeof inputAmount === 'string') {
    setInputAmount(prev => prev.slice(0, -1));
  } else if (activeInput === 'betAmount' && typeof betAmount === 'string') {
    setBetAmount(prev => prev.slice(0, -1));
  } else if (activeInput === 'prizeAmount' && typeof prizeAmount === 'string') {
    setPrizeAmount(prev => prev.slice(0, -1));
  } else if (activeInput === 'cashOutAmount' && typeof cashOutAmount === 'string') {
    setCashOutAmount(prev => prev.slice(0, -1));
  } else if (activeInput === 'attempts' && typeof attempts === 'string') {
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

  const handleHideKeyboard = () => {
    setShowKeyboard(false);
  };

const handleTabClick = () => {
  if (activeInput === 'inputAmount') {
    handleInputFocus('betAmount', betInputRef.current);
  } else if (activeInput === 'betAmount') {
    handleInputFocus('attempts', attemptsInputRef.current); // 下注金额 -> 尝试次数
  } else if (activeInput === 'attempts') {
    handleInputFocus('prizeAmount', prizeInputRef.current); // 尝试次数 -> 中奖金额
  } else if (activeInput === 'prizeAmount') {
    handleInputFocus('cashOutAmount', cashOutInputRef.current);
  } else if (activeInput === 'cashOutAmount') {
    handleInputFocus('inputAmount', inputAmountInputRef.current);
  }
};

  const handleInputFocus = (inputField, inputElement) => {
	if (isKeyboardEnabled) {
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      inputElement.blur();
    }
    toggleKeyboard(inputField, inputElement);
		setActiveInputRef(inputElement);
		}
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (keyboardRef.current && !keyboardRef.current.contains(event.target) &&
          activeInputRef && !activeInputRef.contains(event.target)) {
        setShowKeyboard(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeInputRef]);

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
            {mainPhoto && (
              <div style={{ position: 'relative', display: 'inline-block', marginTop: '10px' }}>
                <img src={mainPhoto} alt="Main" style={{ maxWidth: '100%', maxHeight: '300px', display: 'block', objectFit: 'contain' }} />
                <button
                  type="button"
                  onClick={handleRemoveMainPhoto}
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
            )}
          </div>
         </div>
				<div className="form-group">
 					 <label htmlFor="gameName">游戏名称:</label>
  					<input
  					 type="text"
    					id="gameName"
    						value={gameName}
   						 onChange={(e) => setGameName(e.target.value)}
   						 list="gameNamesList"
  />
  <datalist id="gameNamesList">
    {gameNames.map((name) => (
      <option key={name} value={name} />
    ))}
  </datalist>
</div>
        <div className="form-group">
  <label>
    启用数字键盘:
    <input
      type="checkbox"
      checked={isKeyboardEnabled}
      onChange={() => setIsKeyboardEnabled(!isKeyboardEnabled)}
    />
  </label>
</div>

				<div className="form-group">
          <label htmlFor="inputAmount">投入金额:</label>
          <input
            type="text"
            id="inputAmount"
            value={inputAmount}
            onChange={(e) => setInputAmount(e.target.value)}
            onFocus={(e) => handleInputFocus('inputAmount', e.target)}
            ref={inputAmountInputRef}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="betAmount">下注金额:</label>
          <input
            type="text"
            id="betAmount"
            value={betAmount}
            onChange={(e) => setBetAmount(e.target.value)}
            onFocus={(e) => handleInputFocus('betAmount', e.target)}
            ref={betInputRef}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="attempts">尝试次数:</label>
          <input
            type="text"
            id="attempts"
            value={attempts}
            onChange={(e) => setAttempts(e.target.value)}
            onFocus={(e) => handleInputFocus('attempts', e.target)}
            ref={attemptsInputRef}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="prizeAmount">中奖金额:</label>
          <input
            type="text"
            id="prizeAmount"
            value={prizeAmount}
            onChange={(e) => setPrizeAmount(e.target.value)}
            onFocus={(e) => handleInputFocus('prizeAmount', e.target)}
            ref={prizeInputRef}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="cashOutAmount">兑换金额:</label>
          <input
            type="text"
            id="cashOutAmount"
            value={cashOutAmount}
            onChange={(e) => setCashOutAmount(e.target.value)}
            onFocus={(e) => handleInputFocus('cashOutAmount', e.target)}
            ref={cashOutInputRef}
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
          {parseFloat(prizeAmount) > 0 && ( // 条件渲染
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
          )}
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
            <button type="button" onClick={handleTabClick} className="keyboard-button" style={{ fontSize: '16px' }}>Tab</button>
            <button type="button" onClick={handleHideKeyboard} className="keyboard-button" style={{ fontSize: '16px' }}>隐藏</button>
          </div>
        </div>
      )}
      <button type="button" onClick={handleBackToModules} style={{ marginTop: '10px', backgroundColor: '#6c757d' }}>返回神奇百宝箱</button>
    </div>
  );
}

export default TigerGamePage;
