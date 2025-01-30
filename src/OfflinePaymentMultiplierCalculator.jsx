
    import React, { useState, useRef, useEffect } from 'react';
    import { useNavigate } from 'react-router-dom';
    import supabase from './supabaseClient';

    function OfflinePaymentMultiplierCalculator() {
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
      const [groupByHour, setGroupByHour] = useState(false);
      const [groupByDay, setGroupByDay] = useState(false);
      const [sortField, setSortField] = useState(null);
      const [sortDirection, setSortDirection] = useState('asc');
      const [showComplexQuery, setShowComplexQuery] = useState(false);
      const [syncing, setSyncing] = useState(false);
      const [syncMessage, setSyncMessage] = useState('');
      const [showLoginModal, setShowLoginModal] = useState(false);
      const [loginUsername, setLoginUsername] = useState('');
      const [loginPassword, setLoginPassword] = useState('');
      const [userId, setUserId] = useState(localStorage.getItem('offlineCalculatorUserId') || null);
      const [loginError, setLoginError] = useState('');
      const [showClearModal, setShowClearModal] = useState(false);
      const [clearOption, setClearOption] = useState('synced');

      useEffect(() => {
        fetchRecords();
      }, [startDate, endDate, groupByHour, groupByDay, sortField, sortDirection, showComplexQuery, showHistory]);

      const fetchRecords = () => {
        setLoading(true);
        try {
          const storedLogs = localStorage.getItem('offlinePaymentMultiplierLogs');
          if (storedLogs) {
            setRecords(JSON.parse(storedLogs));
          } else {
            setRecords([]);
          }
        } catch (error) {
          console.error('获取本地支付倍数记录时发生错误:', error);
        } finally {
          setLoading(false);
        }
      };

      const handleAddRecord = () => {
        if (betAmount && prizeAmount && gameName) {
          setLoading(true);
          try {
            const newRecord = {
              id: Date.now(),
              game_name: gameName,
              bet_amount: parseFloat(betAmount),
              prize_amount: parseFloat(prizeAmount),
              created_at: new Date().toISOString(),
              isSynced: false,
            };
            const storedLogs = localStorage.getItem('offlinePaymentMultiplierLogs');
            let existingLogs = storedLogs ? JSON.parse(storedLogs) : [];
            existingLogs = [newRecord, ...existingLogs];
            localStorage.setItem('offlinePaymentMultiplierLogs', JSON.stringify(existingLogs));
            setRecords(existingLogs);
            setBetAmount('');
            setPrizeAmount('');
            setGameName('');
          } catch (error) {
            console.error('添加本地支付倍数记录时发生错误:', error);
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

      const handleBackToModules = () => {
        navigate('/modules');
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

      const handleHideKeyboard = () => {
        setShowKeyboard(false);
      };

      const handleTabClick = () => {
        if (activeInput === 'gameName') {
          handleInputFocus('betAmount', betInputRef.current);
        } else if (activeInput === 'betAmount') {
          handleInputFocus('prizeAmount', prizeInputRef.current);
        } else if (activeInput === 'prizeAmount') {
          handleInputFocus('gameName', gameNameInputRef.current);
        } else if (activeInput === 'editedGameName') {
          handleInputFocus('editedBetAmount', betInputRef.current);
        } else if (activeInput === 'editedBetAmount') {
          handleInputFocus('editedPrizeAmount', prizeInputRef.current);
        } else if (activeInput === 'editedPrizeAmount') {
          handleInputFocus('editedGameName', gameNameInputRef.current);
        }
      };

      const handleInputFocus = (inputField, inputElement) => {
        if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
          inputElement.blur();
        }
        toggleKeyboard(inputField, inputElement);
      };

      const handleEditLog = (log) => {
        setEditingLogId(log.id);
        setEditedGameName(log.game_name);
        setEditedBetAmount(String(log.bet_amount));
        setEditedPrizeAmount(String(log.prize_amount));
      };

      const handleUpdateLog = (id) => {
        if (editedGameName && editedBetAmount && editedPrizeAmount) {
          setLoading(true);
          try {
            const updatedLogs = records.map((record) =>
              record.id === id ? { ...record, game_name: editedGameName, bet_amount: parseFloat(editedBetAmount), prize_amount: parseFloat(editedPrizeAmount), updated_at: new Date().toISOString() } : record,
            );
            localStorage.setItem('offlinePaymentMultiplierLogs', JSON.stringify(updatedLogs));
            setRecords(updatedLogs);
            setEditingLogId(null);
            setEditedGameName('');
            setEditedBetAmount('');
            setEditedPrizeAmount('');
          } catch (error) {
            console.error('更新本地支付倍数记录时发生错误:', error);
          } finally {
            setLoading(false);
          }
        }
      };

      const handleDeleteLog = (id) => {
        if (confirmDeleteId === id) {
          setLoading(true);
          try {
            const updatedLogs = records.filter((record) => record.id !== id);
            localStorage.setItem('offlinePaymentMultiplierLogs', JSON.stringify(updatedLogs));
            setRecords(updatedLogs);
            setConfirmDeleteId(null);
          } catch (error) {
            console.error('删除本地支付倍数记录时发生错误:', error);
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
        return [...new Set(gameNames)];
      };

      const getFilterGameNames = () => {
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
          const date = new Date(record.created_at);
          const key = groupByHour
            ? `${date.toLocaleDateString()} ${date.getHours()}`
            : groupByDay
            ? date.toLocaleDateString()
            : 'all';

          if (!summary[key]) {
            summary[key] = {};
          }
          if (!summary[key][record.game_name]) {
            summary[key][record.game_name] = {
              count: 0,
              totalMultiplier: 0,
              totalBetAmount: 0,
            };
          }
          summary[key][record.game_name].count++;
          if (record.bet_amount > 0) {
            summary[key][record.game_name].totalMultiplier += record.prize_amount / record.bet_amount;
            summary[key][record.game_name].totalBetAmount += record.bet_amount;
          }
        });

        let summaryArray = Object.entries(summary).map(([key, games]) => ({
          key,
          games: Object.entries(games).map(([gameName, data]) => ({
            gameName,
            count: data.count,
            averageMultiplier: data.totalBetAmount > 0 ? (data.totalMultiplier / data.count).toFixed(2) : 0,
          })),
        }));

        if (sortField === 'averageMultiplier') {
          summaryArray = summaryArray.sort((a, b) => {
            const avgA = a.games.reduce((sum, game) => sum + game.averageMultiplier, 0) / a.games.length;
            const avgB = b.games.reduce((sum, game) => sum + game.averageMultiplier, 0) / b.games.length;
            return sortDirection === 'asc' ? avgA - avgB : avgB - avgA;
          });
        }

        return summaryArray;
      };

      const handleSort = (field) => {
        if (sortField === field) {
          setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
          setSortField(field);
          setSortDirection('asc');
        }
      };

      const handleGroupByHourChange = () => {
        setGroupByHour(!groupByHour);
        if (groupByDay) {
          setGroupByDay(false);
        }
      };

      const handleGroupByDayChange = () => {
        setGroupByDay(!groupByDay);
        if (groupByHour) {
          setGroupByHour(false);
        }
      };

      const handleShowComplexQueryChange = () => {
        setShowComplexQuery(!showComplexQuery);
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

        const handleSync = async () => {
            setSyncing(true);
            setSyncMessage('正在同步数据...');
            if (!userId) {
              setShowLoginModal(true);
              setSyncing(false);
              return;
            }
            try {
              const storedLogs = localStorage.getItem('offlinePaymentMultiplierLogs');
              if (!storedLogs) {
                setSyncMessage('没有需要同步的数据。');
                setSyncing(false);
                return;
              }

              const logsToSync = JSON.parse(storedLogs).filter(log => !log.isSynced);
              if (logsToSync.length === 0) {
                setSyncMessage('所有数据已同步。');
                setSyncing(false);
                return;
              }

              for (const log of logsToSync) {
                const { data, error } = await supabase
                  .from('payment_multiplier_logs')
                  .insert([{
                    user_id: userId,
                    game_name: log.game_name,
                    bet_amount: log.bet_amount,
                    prize_amount: log.prize_amount,
                    created_at: log.created_at,
                  }]);

                if (error) {
                  console.error('同步数据到 Supabase 时发生错误:', error);
                  setSyncMessage(`同步数据失败，请重试。错误信息: ${error.message}`);
                  setSyncing(false);
                  return;
                } else {
                  console.log('数据同步成功:', data);
                  const updatedLogs = records.map(record =>
                    record.id === log.id ? { ...record, isSynced: true } : record
                  );
                  localStorage.setItem('offlinePaymentMultiplierLogs', JSON.stringify(updatedLogs));
                  setRecords(updatedLogs);
                }
              }
              setSyncMessage('数据同步成功！');
            } catch (error) {
              console.error('同步数据时发生意外错误:', error);
              setSyncMessage(`同步数据失败，请重试。错误信息: ${error.message}`);
            } finally {
              setSyncing(false);
            }
          };

          const handleLogin = async () => {
            setLoading(true);
            setLoginError('');
            try {
              const { data, error } = await supabase
                .from('users')
                .select('id')
                .eq('username', loginUsername)
                .eq('password', loginPassword)
                .single();

              if (error) {
                console.error('登录时发生错误:', error);
                setLoginError('登录失败，请重试。');
              } else if (data) {
                console.log('登录成功, user_id:', data.id);
                setUserId(data.id);
                localStorage.setItem('offlineCalculatorUserId', data.id);
                setShowLoginModal(false);
                setLoginUsername('');
                setLoginPassword('');
                handleSync();
              } else {
                setLoginError('用户名或密码无效。');
              }
            } catch (error) {
              console.error('发生意外错误:', error);
              setLoginError('发生意外错误，请重试。');
            } finally {
              setLoading(false);
            }
          };

        const handleClearData = () => {
            setShowClearModal(true);
        };

        const handleConfirmClearData = () => {
            setLoading(true);
            try {
                if (clearOption === 'synced') {
                    const updatedLogs = records.filter(record => !record.isSynced);
                    localStorage.setItem('offlinePaymentMultiplierLogs', JSON.stringify(updatedLogs));
                    setRecords(updatedLogs);
                } else {
                    localStorage.removeItem('offlinePaymentMultiplierLogs');
                    setRecords([]);
                }
                setShowClearModal(false);
            } catch (error) {
                console.error('清空本地支付倍数记录时发生错误:', error);
            } finally {
                setLoading(false);
            }
        };

        const handleCancelClearData = () => {
            setShowClearModal(false);
        };

      return (
        <div className="container" ref={containerRef}>
          <h2>支付倍数计算器（离线版）</h2>
          <div className="form-group">
            <label htmlFor="gameName">游戏名称:</label>
            <input
              type="text"
              id="gameName"
              value={gameName}
              onChange={(e) => setGameName(e.target.value)}
              ref={gameNameInputRef}
              maxLength="15"
              list="gameNames"
            />
            <datalist id="gameNames">
              {getUniqueGameNames().map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
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
            <strong>总平均支付倍数:</strong> {calculateAverageMultiplier()}
          </p>
          <p>
            <strong>总记录数:</strong> {records.length}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
            <label style={{ marginRight: '10px' }}>
              复杂查询
              <input
                type="checkbox"
                checked={showComplexQuery}
                onChange={() => handleShowComplexQueryChange()}
                style={{ width: 'auto', margin: '0' }}
              />
            </label>
          </div>
          {showComplexQuery && (
            <>
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
                  {getFilterGameNames().map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
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
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                <label style={{ marginRight: '10px' }}>
                  按小时汇总
                  <input
                    type="checkbox"
                    checked={groupByHour}
                    onChange={handleGroupByHourChange}
                    style={{ width: 'auto', margin: '0' }}
                  />
                </label>
                <label style={{ marginRight: '10px' }}>
                  按天汇总
                  <input
                    type="checkbox"
                    checked={groupByDay}
                    onChange={handleGroupByDayChange}
                    style={{ width: 'auto', margin: '0' }}
                  />
                </label>
              </div>
            </>
          )}
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
          {showHistory && (
            <div className="inspiration-list">
              <h3>游戏汇总</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>
                      {groupByHour ? '时间 (小时)' : groupByDay ? '时间 (天)' : '游戏名称'}
                    </th>
                    <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>游戏名称</th>
                    <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>记录总数</th>
                    <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left', cursor: 'pointer' }} onClick={() => handleSort('averageMultiplier')}>平均支付倍数</th>
                  </tr>
                </thead>
                <tbody>
                  {getGameSummary().map((summary) => (
                    summary.games.map((game, index) => (
                      <tr key={`${summary.key}-${game.gameName}-${index}`}>
                        <td style={{ border: '1px solid #ddd', padding: '8px' }}>{summary.key}</td>
                        <td style={{ border: '1px solid #ddd', padding: '8px' }}>{game.gameName}</td>
                        <td style={{ border: '1px solid #ddd', padding: '8px' }}>{game.count}</td>
                        <td style={{ border: '1px solid #ddd', padding: '8px' }}>{game.averageMultiplier}</td>
                      </tr>
                    ))
                  ))}
                </tbody>
              </table>
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
                <button type="button" onClick={handleTabClick} className="keyboard-button">Tab</button>
                <button type="button" onClick={handleHideKeyboard} className="keyboard-button">隐藏</button>
              </div>
            </div>
          )}
          <button type="button" onClick={handleSync} disabled={syncing} style={{ marginTop: '20px', backgroundColor: '#007bff' }}>
            {syncing ? '同步中...' : '同步到云端'}
          </button>
          {syncMessage && <p style={{ marginTop: '10px', textAlign: 'center' }}>{syncMessage}</p>}
          {showLoginModal && (
            <div className="modal">
              <div className="modal-content">
                <h2>登录</h2>
                <div className="form-group">
                  <label htmlFor="loginUsername">用户名:</label>
                  <input
                    type="text"
                    id="loginUsername"
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="loginPassword">密码:</label>
                  <input
                    type="password"
                    id="loginPassword"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                  />
                </div>
                {loginError && <p className="error-message">{loginError}</p>}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                  <button type="button" onClick={handleLogin} disabled={loading} style={{ backgroundColor: '#28a745' }}>
                    {loading ? '登录中...' : '登录'}
                  </button>
                  <button type="button" onClick={() => setShowLoginModal(false)} style={{ backgroundColor: '#dc3545' }}>
                    取消
                  </button>
                </div>
              </div>
            </div>
          )}
          <button type="button" onClick={handleClearData} style={{ marginTop: '20px', backgroundColor: '#dc3545' }}>
            清空数据
          </button>
          {showClearModal && (
            <div className="modal">
              <div className="modal-content">
                <h2>清空数据</h2>
                <p>请选择要清空的数据类型：</p>
                <div className="form-group">
                  <label>
                    <input
                      type="radio"
                      value="synced"
                      checked={clearOption === 'synced'}
                      onChange={() => setClearOption('synced')}
                    />
                    仅清空已同步数据
                  </label>
                </div>
                <div className="form-group">
                  <label>
                    <input
                      type="radio"
                      value="all"
                      checked={clearOption === 'all'}
                      onChange={() => setClearOption('all')}
                    />
                    清空所有数据
                  </label>
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                  <button type="button" onClick={handleConfirmClearData} disabled={loading} style={{ backgroundColor: '#28a745' }}>
                    {loading ? '正在清空...' : '确认清空'}
                  </button>
                  <button type="button" onClick={handleCancelClearData} style={{ backgroundColor: '#dc3545' }}>
                    取消
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }

    export default OfflinePaymentMultiplierCalculator;