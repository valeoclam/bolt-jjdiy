import React, { useState, useEffect } from 'react';
    import { Link, useNavigate } from 'react-router-dom';

    function TigerGameHistory() {
      const [logs, setLogs] = useState([]);
      const [startDate, setStartDate] = useState('');
      const [endDate, setEndDate] = useState('');
      const [sortedLogs, setSortedLogs] = useState([]);
      const [sortByProfit, setSortByProfit] = useState(false);
      const [editingLogId, setEditingLogId] = useState(null);
      const [inputAmount, setInputAmount] = useState('');
      const [cashOutAmount, setCashOutAmount] = useState('');
      const [mainPhoto, setMainPhoto] = useState(null);
      const [winningPhotos, setWinningPhotos] = useState([]);
      const [addTime, setAddTime] = useState(null);
      const [modifyTime, setModifyTime] = useState(null);
      const [confirmDeleteId, setConfirmDeleteId] = useState(null);
      const navigate = useNavigate();
      const user = {id: 'test-user-id'};

      useEffect(() => {
        const fetchLogs = async () => {
          const storedLogs = sessionStorage.getItem('cashLogs');
          if (storedLogs) {
            setLogs(JSON.parse(storedLogs));
          }
        };
        fetchLogs();
      }, []);

      useEffect(() => {
        setSortedLogs([...logs].reverse());
      }, [logs]);

      const calculateTotalProfit = () => {
        const filteredLogs = logs.filter((log) => {
          const logTime = new Date(log.addTime).getTime();
          const startTime = startDate ? new Date(startDate).getTime() : 0;
          const endTime = endDate ? new Date(endDate).getTime() : Infinity;
          return logTime >= startTime && logTime <= endTime;
        });
        return filteredLogs.reduce(
          (total, log) => total + (log.cashOutAmount - log.inputAmount),
          0,
        );
      };

      const handleSortByProfit = () => {
        setSortByProfit(!sortByProfit);
        setSortedLogs((prevLogs) => {
          const sorted = [...prevLogs].sort((a, b) =>
            sortByProfit
              ? (a.cashOutAmount - a.inputAmount) -
                (b.cashOutAmount - b.inputAmount)
              : (b.cashOutAmount - a.inputAmount) -
                (a.cashOutAmount - a.inputAmount),
          );
          return sorted;
        });
      };

      const handleEditLog = (log) => {
        setEditingLogId(log.id);
        setInputAmount(log.inputAmount);
        setCashOutAmount(log.cashOutAmount);
        setMainPhoto(log.mainPhoto);
        setWinningPhotos(() => log.winningPhotos);
        setAddTime(log.addTime);
        setModifyTime(log.modifyTime);
      };

      const handleUpdateLog = async (e) => {
        e.preventDefault();
        const updatedLog = {
          inputAmount: parseFloat(inputAmount),
          cashOutAmount: parseFloat(cashOutAmount),
          mainPhoto: mainPhoto,
          winningPhotos: winningPhotos,
          modifyTime: new Date().toLocaleString(),
        };
        const updatedLogs = logs.map((log) =>
          log.id === editingLogId ? { ...log, ...updatedLog } : log,
        );
        setLogs(updatedLogs);
        setEditingLogId(null);
        setInputAmount('');
        setCashOutAmount('');
        setMainPhoto(null);
        setWinningPhotos([]);
        setAddTime(null);
        setModifyTime(null);
        navigate('/tiger-game/history');
      };

      const handleDeleteLog = async (id) => {
        if (confirmDeleteId === id) {
          const updatedLogs = logs.filter((log) => log.id !== id);
          setLogs(updatedLogs);
          setConfirmDeleteId(null);
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
          }
        }
      };

      return (
        <div className="container">
          <h1>历史记录</h1>
          <Link to="/tiger-game" className="link-button">
            返回添加记录
          </Link>
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
          <button type="button" onClick={handleSortByProfit}>
            按盈亏金额排序
          </button>
          {sortedLogs.map((log, index) => (
            <div key={log.id} className="log-item">
              <p>
                <strong>编号:</strong>{' '}
                {logs.length - logs.findIndex((l) => l.id === log.id)}
              </p>
              <p>
                <strong>添加时间:</strong> {log.addTime}
              </p>
              {log.modifyTime && (
                <p>
                  <strong>修改时间:</strong> {log.modifyTime}
                </p>
              )}
              <p>
                <strong>投入金额:</strong> {log.inputAmount}
              </p>
              <p>
                <strong>兑换金额:</strong> {log.cashOutAmount}
              </p>
              <p>
                <strong>盈亏金额:</strong> {log.cashOutAmount - log.inputAmount}
              </p>
              {log.mainPhoto && <img src={log.mainPhoto} alt="Main Log" />}
              {log.winningPhotos &&
                log.winningPhotos.map((photo, index) => (
                  <img key={index} src={photo} alt={`Winning Log ${index + 1}`} />
                ))}
              {editingLogId === log.id ? (
                <form onSubmit={handleUpdateLog}>
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
                  <button type="submit">更新</button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingLogId(null);
                      navigate('/tiger-game/history');
                    }}
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
          ))}
        </div>
      );
    }

    export default TigerGameHistory;
