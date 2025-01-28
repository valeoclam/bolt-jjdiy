import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fhcsffagxchzpxouuiuq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZoY3NmZmFneGNoenB4b3V1aXVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzYyMTQzMzAsImV4cCI6MjA1MTc5MDMzMH0.1DMl870gjGRq5LRlQMES9WpYWehiKiPIea2Yj1q4Pz8';
const supabase = createClient(supabaseUrl, supabaseKey);

function PaymentMultiplierCalculator({ loggedInUser, onLogout }) {
  const [records, setRecords] = useState([]);
  const [betAmount, setBetAmount] = useState('');
  const [prizeAmount, setPrizeAmount] = useState('');
  const [gameName, setGameName] = useState('');
  const navigate = useNavigate();
  const [activeInput, setActiveInput] = useState(null);
  const [showKeyboard, setShowKeyboard] = useState(false);
  const keyboardRef = useRef(null);
  const inputRef = useRef(null);
  const [keyboardPosition, setKeyboardPosition] = useState({ top: 0, left: 0 });
  const keyboardOffset = 5;
  const [editingLogId, setEditingLogId] = useState(null);
  const [editedGameName, setEditedGameName] = useState('');
  const [editedBetAmount, setEditedBetAmount] = useState('');
  const [editedPrizeAmount, setEditedPrizeAmount] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filterGameName, setFilterGameName] = useState('');
  const betInputRef = useRef(null);
  const prizeInputRef = useRef(null);
  const gameNameInputRef = useRef(null);
  const containerRef = useRef(null);
  const [showHistory, setShowHistory] = useState(false);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    if (loggedInUser) {
      fetchRecords(loggedInUser);
    }
  }, [loggedInUser, startDate, endDate]);

  const fetchRecords = async (loggedInUser) => {
    setLoading(true);
    try {
      let query = supabase
        .from('payment_multiplier_logs')
        .select('*')
        .eq('user_id', loggedInUser.id)
        .order('created_at', { ascending: false });

      if (startDate) {
        query = query.gte('created_at', `${startDate}:00.000Z`);
      }
      if (endDate) {
        query = query.lt('created_at', `${endDate}:00.000Z`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('获取支付倍数记录时发生错误:', error);
      } else {
        setRecords(data || []);
      }
    } catch (error) {
      console.error('发生意外错误:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRecord = async () => {
    if (betAmount && prizeAmount && gameName && loggedInUser) {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('payment_multiplier_logs')
          .insert([{
            user_id: loggedInUser.id,
            game_name: gameName,
            bet_amount: parseFloat(betAmount),
            prize_amount: parseFloat(prizeAmount),
          }])
          .select('*');

        if (error) {
          console.error('添加支付倍数记录时发生错误:', error);
        } else {
          console.log('支付倍数记录添加成功:', data);
          setRecords(prevRecords => [data[0], ...prevRecords]);
          setBetAmount('');
          setPrizeAmount('');
          setGameName('');
        }
      } catch (error) {
        console.error('发生意外错误:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const calculateAverageMultiplier = () => {
    if (records.length === 0) return 0;
    let validRecords = records.filter(record => record.bet_amount > 0);
    if (validRecords.length === 0) return 0;
    const totalMultiplier = validRecords.reduce((sum, record) => sum + (record.prize_amount / record.bet_amount), 0);
    return (totalMultiplier / validRecords.length).toFixed(2);
  };

  const handleBackToAdmin = () => {
    navigate('/admin');
  };

  const handleNumberClick = (number) => {
    if (activeInput === 'betAmount') {
      setBetAmount(prev => prev + number);
    } else if (activeInput === 'prizeAmount') {
      setPrizeAmount(prev => prev + number);
    } else if (activeInput === 'editedBetAmount') {
      setEditedBetAmount(prev => prev + number);
    } else if (activeInput === 'editedPrizeAmount') {
      setEditedPrizeAmount(prev => prev + number);
    }
  };

  const handleBackspaceClick = () => {
    if (activeInput === 'betAmount') {
      setBetAmount(prev => prev.slice(0, -1));
    } else if (activeInput === 'prizeAmount') {
      setPrizeAmount(prev => prev.slice(0, -1));
    } else if (activeInput === 'editedBetAmount') {
      setEditedBetAmount(prev => prev.slice(0, -1));
    } else if (activeInput === 'editedPrizeAmount') {
      setEditedPrizeAmount(prev => prev.slice(0, -1));
    }
  };

  const handleClearClick = () => {
    if (activeInput === 'betAmount') {
      setBetAmount('');
    } else if (activeInput === 'prizeAmount') {
      setPrizeAmount('');
    } else if (activeInput === 'editedBetAmount') {
      setEditedBetAmount('');
    } else if (activeInput === 'editedPrizeAmount') {
      setEditedPrizeAmount('');
    }
  };

  const handleDecimalClick = () => {
    if (activeInput === 'betAmount' && !betAmount.includes('.')) {
      setBetAmount(prev => prev + '.');
    } else if (activeInput === 'prizeAmount' && !prizeAmount.includes('.')) {
      setPrizeAmount(prev => prev + '.');
    } else if (activeInput === 'editedBetAmount' && !editedBetAmount.includes('.')) {
      setEditedBetAmount(prev => prev + '.');
    } else if (activeInput === 'editedPrizeAmount' && !editedPrizeAmount.includes('.')) {
      setEditedPrizeAmount(prev => prev + '.');
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

  const handleEditLog = async (log) => {
    setEditingLogId(log.id);
    setEditedGameName(log.game_name);
    setEditedBetAmount(String(log.bet_amount));
    setEditedPrizeAmount(String(log.prize_amount));
  };

  const handleUpdateLog = async (id) => {
    if (editedGameName && editedBetAmount && editedPrizeAmount && loggedInUser) {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('payment_multiplier_logs')
          .update({
            game_name: editedGameName,
            bet_amount: parseFloat(editedBetAmount),
            prize_amount: parseFloat(editedPrizeAmount),
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
          .select('*');

        if (error) {
          console.error('更新支付倍数记录时发生错误:', error);
        } else {
          console.log('支付倍数记录更新成功:', data);
          setRecords((prevRecords) =>
            prevRecords.map((record) =>
              record.id === id ? { ...record, ...data[0] } : record,
            ),
          );
          setEditingLogId(null);
          setEditedGameName('');
          setEditedBetAmount('');
          setEditedPrizeAmount('');
        }
      } catch (error) {
        console.error('发生意外错误:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDeleteLog = async (id) => {
    if (confirmDeleteId === id && loggedInUser) {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('payment_multiplier_logs')
          .delete()
          .eq('id', id);

        if (error) {
          console.error('删除支付倍数记录时发生错误:', error);
        } else {
          console.log('支付倍数记录删除成功:', data);
          setRecords((prevRecords) => prevRecords.filter((record) => record.id !== id));
          setConfirmDeleteId(null);
        }
      } catch (error) {
        console.error('发生意外错误:', error);
      } finally {
        setLoading(false);
      }
    } else {
      setConfirmDeleteId(id);
    }
  };

  const handleCancelEdit = () => {
    setEditingLogId(null);
    setEditedGameName('');
    setEditedBetAmount('');
    setEditedPrizeAmount('');
  };

  const handleSearchChange = (e) => {
    setSearchKeyword(e.target.value);
  };

  const handleFilterChange = (e) => {
    setFilterGameName(e.target.value);
  };

  const getUniqueGameNames = () => {
    const gameNames = records.map((record) => record.game_name);
    return ['全部', ...new Set(gameNames)];
  };

  const filteredRecords = records.filter((record) => {
    const gameNameMatch = filterGameName === '全部' || !filterGameName || record.game_name.includes(filterGameName);
    const searchMatch = !searchKeyword || record.game_name.toLowerCase().includes(searchKeyword.toLowerCase()) || String(record.bet_amount).includes(searchKeyword) || String(record.prize_amount).includes(searchKeyword);
    const logTime = new Date(record.created_at).getTime();
    const startTime = startDate ? new Date(startDate).getTime() : 0;
    const endTime = endDate ? new Date(endDate).getTime() : Infinity;
    return gameNameMatch && searchMatch && logTime >= startTime && logTime <= endTime;
  });

  const getGameSummary = () => {
    const summary = {};
    filteredRecords.forEach((record) => {
      if (!summary[record.game_name]) {
        summary[record.game_name] = {
          count: 0,
          totalMultiplier: 0,
          totalBetAmount: 0,
        };
      }
      summary[record.game_name].count++;
      if (record.bet_amount > 0) {
        summary[record.game_name].totalMultiplier += record.prize_amount / record.bet_amount;
        summary[record.game_name].totalBetAmount += record.bet_amount;
      }
    });

    return Object.entries(summary).map(([gameName, data]) => ({
      gameName,
      count: data.count,
      averageMultiplier: data.totalBetAmount > 0 ? (data.totalMultiplier / data.count).toFixed(2) : 0,
    }));
  };

  useEffect(() => {
    if (gameNameInputRef.current) {
      gameNameInputRef.current.value = String(gameName);
    }
  }, [gameName]);

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

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (keyboardRef.current && !keyboardRef.current.contains(event.target) &&
          containerRef.current && !containerRef.current.contains(event.target)) {
        setShowKeyboard(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, []);

  return (
    <div className="container" ref={containerRef}>
      <h2>打虎日记 - 支付倍数计算器</h2>
      <button type="button" onClick={onLogout} className="logout-button">退出</button>
      <button type="button" onClick={handleBackToAdmin} style={{ marginTop: '10px', backgroundColor: '#6c757d' }}>返回后台管理</button>
      <div className="form-group">
        <label htmlFor="gameName">游戏名称:</label>
        <input
          type="text"
          id="gameName"
          value={gameName}
          onChange={(e) => setGameName(e.target.value)}
          ref={gameNameInputRef}
          maxLength="15"
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
      <button type="button" onClick={handleAddRecord} style={{ backgroundColor: '#28a745' }}>添加记录</button>
      <p>
        <strong>平均支付倍数:</strong> {calculateAverageMultiplier()}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '10px' }}>
        <input
          type="text"
          placeholder="搜索游戏名称/金额"
          value={searchKeyword}
          onChange={handleSearchChange}
          style={{ marginBottom: '10px', padding: '10px', fontSize: '16px', borderRadius: '4px', border: '1px solid #ddd' }}
        />
        <select
          value={filterGameName}
          onChange={handleFilterChange}
          style={{ padding: '10px', fontSize: '16px', borderRadius: '4px', border: '1px solid #ddd' }}
        >
          {getUniqueGameNames().map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
        <label style={{ marginRight: '10px' }}>
          显示历史记录
          <input
            type="checkbox"
            checked={showHistory}
            onChange={() => setShowHistory(!showHistory)}
            style={{ width: 'auto', margin: '0' }}
          />
        </label>
      </div>
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
      <div className="inspiration-list">
        <h3>游戏汇总</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>游戏名称</th>
              <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>记录总数</th>
              <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>平均支付倍数</th>
            </tr>
          </thead>
          <tbody>
            {getGameSummary().map((summary) => (
              <tr key={summary.gameName}>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{summary.gameName}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{summary.count}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{summary.averageMultiplier}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showHistory && (
        <div className="inspiration-list">
          <h3>记录列表</h3>
          {filteredRecords.map((record) => (
            <div key={record.id} className="inspiration-item">
              {editingLogId === record.id ? (
                <>
                  <input
                    type="text"
                    value={editedGameName}
                    onChange={(e) => setEditedGameName(e.target.value)}
                    maxLength="15"
                    style={{ marginBottom: '5px' }}
                  />
                  <input
                    type="text"
                    value={editedBetAmount}
                    onChange={(e) => setEditedBetAmount(e.target.value)}
                    onFocus={(e) => handleInputFocus('editedBetAmount', e.target)}
                    style={{ marginBottom: '5px' }}
                  />
                  <input
                    type="text"
                    value={editedPrizeAmount}
                    onChange={(e) => setEditedPrizeAmount(e.target.value)}
                    onFocus={(e) => handleInputFocus('editedPrizeAmount', e.target)}
                    style={{ marginBottom: '5px' }}
                  />
                  <div className="edit-buttons">
                    <button onClick={() => handleUpdateLog(record.id)}>保存</button>
                    <button onClick={handleCancelEdit} style={{ backgroundColor: '#6c757d' }}>取消</button>
                  </div>
                </>
              ) : (
                <>
                  <p>
                    <strong>游戏名称:</strong> {record.game_name}
                  </p>
                  <p>
                    <strong>下注金额:</strong> {record.bet_amount}
                  </p>
                  <p>
                    <strong>中奖金额:</strong> {record.prize_amount}
                  </p>
                  <div className="edit-buttons">
                    <button onClick={() => handleEditLog(record)}>编辑</button>
                    <button onClick={() => handleDeleteLog(record.id)} style={{ backgroundColor: '#dc3545' }}>
                      {confirmDeleteId === record.id ? '确认删除' : '删除'}
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
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
    </div>
  );
}

export default PaymentMultiplierCalculator;
