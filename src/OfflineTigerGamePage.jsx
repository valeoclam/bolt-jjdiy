import React, { useState, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import * as EXIF from 'exifreader';
import imageCompression from 'browser-image-compression';
import { useNavigate } from 'react-router-dom';
import supabase from './supabaseClient';

function OfflineTigerGamePage({ onLogout }) {
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
  const [showHistory, setShowHistory] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [clearOption, setClearOption] = useState('synced');
	const [indexedDBQuota, setIndexedDBQuota] = useState(null);
  const [activeInputRef, setActiveInputRef] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [userId, setUserId] = useState(localStorage.getItem('offlineCalculatorUserId') || null);
	const [totalLogs, setTotalLogs] = useState(0);
  const [syncedLogs, setSyncedLogs] = useState(0);
  const [unsyncedLogs, setUnsyncedLogs] = useState(0);
  const [loginError, setLoginError] = useState('');
  const dbName = 'tigerGameDB';
  const storeName = 'tigerGameLogs';
  const dbVersion = 1;
	const [gameName, setGameName] = useState('');
	const [gameNames, setGameNames] = useState([]);
	const gameNameInputRef = useRef(null);
	const [isKeyboardEnabled, setIsKeyboardEnabled] = useState(true);
	const [showTracking, setShowTracking] = useState(false);
	const [prizeAmountFilter, setPrizeAmountFilter] = useState(false);
	const [filteredLogs, setFilteredLogs] = useState([]); // 添加 filteredLogs 状态
	const [startDate, setStartDate] = useState(''); // 设置默认值
  const [endDate, setEndDate] = useState(''); // 设置默认值
	const [editingLogId, setEditingLogId] = useState(null); // 新增：编辑状态
  const [editedInputAmount, setEditedInputAmount] = useState(''); // 新增：编辑时的投入金额
  const [editedCashOutAmount, setEditedCashOutAmount] = useState(''); // 新增：编辑时的兑换金额
	const [editedGameName, setEditedGameName] = useState(''); // 新增
  const [editedBetAmount, setEditedBetAmount] = useState(''); // 新增
  const [editedPrizeAmount, setEditedPrizeAmount] = useState(''); // 新增
  const [editedAttempts, setEditedAttempts] = useState(''); // 新增
	const [editedEncounteredTrailer, setEditedEncounteredTrailer] = useState(false); // 新增
	const [confirmDeleteId, setConfirmDeleteId] = useState(null);
	const [showSharpeKelly, setShowSharpeKelly] = useState(false);
	const [kellyCriterion, setKellyCriterion] = useState(0);
	const [sharpeRatio, setSharpeRatio] = useState(0);
	const [trackByGameName, setTrackByGameName] = useState(false);
	const [gameNameSummary, setGameNameSummary] = useState([]);
	const [sortColumn, setSortColumn] = useState('gameName');
	const [sortDirection, setSortDirection] = useState('asc');



function calculateKellyCriterion(winRate, odds) {
  return (winRate * odds - (1 - winRate)) / odds;
}

function calculateSharpeRatio(returns, riskFreeRate) {
  const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const stdDev = Math.sqrt(returns.map(x => Math.pow(x - avgReturn, 2)).reduce((a, b) => a + b, 0) / (returns.length - 1));
  return (avgReturn - riskFreeRate) / stdDev;
}



	const getUniqueGameNames = () => {
  const gameNames = logs.map((log) => log.game_name);
  return [...new Set(gameNames)];
};

	const updateMetrics = () => {
  if (showSharpeKelly) {
    // 1. 筛选数据
    const filteredData = logs.filter(log => {
      const logTime = new Date(log.created_at).getTime();
      const startTime = startDate ? new Date(startDate).getTime() : 0;
      const endTime = endDate ? new Date(endDate).getTime() : Infinity;
      return logTime >= startTime && logTime <= endTime;
    });

    // 2. 计算胜率和赔率 (使用筛选后的数据)
    const totalGames = filteredData.length;
    const winningGames = filteredData.filter(log => log.prize_amount > 0).length;
    const winRate = totalGames > 0 ? winningGames / totalGames : 0;

    let totalBetAmount = 0;
    let totalPrizeAmount = 0;
    filteredData.forEach(log => {
      totalBetAmount += log.bet_amount;
      totalPrizeAmount += log.prize_amount;
    });
    const odds = totalBetAmount > 0 ? totalPrizeAmount / totalBetAmount : 0;

    // 3. 计算收益率 (使用筛选后的数据)
    const returns = filteredData.map(log => (log.prize_amount - log.bet_amount) / log.bet_amount);
    const riskFreeRate = 0.02; // 假设无风险利率为 2%

    // 4. 计算凯利值和夏普比率
    const newKellyCriterion = calculateKellyCriterion(winRate, odds);
    const newSharpeRatio = calculateSharpeRatio(returns, riskFreeRate);

    setKellyCriterion(newKellyCriterion);
    setSharpeRatio(newSharpeRatio);
  } else {
    setKellyCriterion(0);
    setSharpeRatio(0);
  }
};

	useEffect(() => {
  updateMetrics();
}, [startDate, endDate, showSharpeKelly, logs]);

	const [todaySummary, setTodaySummary] = useState({
		totalRecords: 0, // 添加总记录数   
		totalAttempts: 0,
    totalProfit: 0,
    averageBetAmount: 0,
		averagePrizeMultiplier: 0, // 添加平均支付倍数
    profitMultiplier: 0,
  });

	const handleDeleteLog = async (id) => {
    if (confirmDeleteId === id) {
      setLoading(true);
      try {
        // 1. 从 IndexedDB 删除
        const request = window.indexedDB.open(dbName, dbVersion);

        request.onsuccess = (event) => {
          const db = event.target.result;
          const transaction = db.transaction(storeName, 'readwrite');
          const store = transaction.objectStore(storeName);
          const deleteRequest = store.delete(id);

          deleteRequest.onsuccess = () => {
            console.log(`成功删除 ID 为 ${id} 的记录`);
            // 2. 更新状态
            setLogs(prevLogs => prevLogs.filter(log => log.id !== id));
            setConfirmDeleteId(null); // 清除确认删除的 ID
          };

          deleteRequest.onerror = (event) => {
            console.error('IndexedDB 数据删除失败:', event.target.error);
            setErrorMessage('删除本地数据失败，请重试。');
          };
        };

        request.onerror = (event) => {
          console.error('打开 IndexedDB 失败:', event.target.error);
          setErrorMessage('打开本地数据库失败，请重试。');
        };
      } catch (error) {
        console.error("删除记录时发生错误:", error);
        setErrorMessage("删除记录时发生错误，请重试。");
      } finally {
        setLoading(false);
      }
    } else {
      setConfirmDeleteId(id); // 设置需要确认删除的 ID
    }
  };

  // 新增：处理编辑历史记录
  const handleEditLog = (log) => {
    setEditingLogId(log.id);
    setEditedGameName(log.game_name);
    setEditedInputAmount(log.input_amount);
    setEditedBetAmount(log.bet_amount);
    setEditedPrizeAmount(log.prize_amount);
    setEditedCashOutAmount(log.cash_out_amount);
    setEditedAttempts(log.attempts);
    setEditedEncounteredTrailer(log.encountered_trailer);
  };

  // 新增：处理取消编辑
  const handleCancelEdit = () => {
    setEditingLogId(null);
  };

  // 新增：处理保存编辑
    const handleSaveEdit = async (log) => {
    setLoading(true);
    try {
      // 1. 更新 IndexedDB
      const request = window.indexedDB.open(dbName, dbVersion);

      request.onsuccess = (event) => {
        const db = event.target.result;
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);

        const updatedLog = {
          ...log,
          game_name: editedGameName,
          input_amount: parseFloat(editedInputAmount),
          bet_amount: parseFloat(editedBetAmount),
          prize_amount: parseFloat(editedPrizeAmount),
          cash_out_amount: parseFloat(editedCashOutAmount),
          attempts: parseInt(editedAttempts, 10),
          encountered_trailer: editedEncounteredTrailer,
        };

        const putRequest = store.put(updatedLog);

        putRequest.onsuccess = () => {
          console.log(`成功更新 ID 为 ${log.id} 的记录`);
          // 2. 更新状态
          setLogs(prevLogs =>
            prevLogs.map(item => (item.id === log.id ? updatedLog : item))
          );
          setEditingLogId(null);
        };

        putRequest.onerror = (event) => {
          console.error('IndexedDB 数据更新失败:', event.target.error);
          setErrorMessage('更新本地数据失败，请重试。');
        };
      };

      request.onerror = (event) => {
        console.error('打开 IndexedDB 失败:', event.target.error);
        setErrorMessage('打开本地数据库失败，请重试。');
      };
    } catch (error) {
      console.error("保存编辑时发生错误:", error);
      setErrorMessage("保存编辑时发生错误，请重试。");
    } finally {
      setLoading(false);
    }
  };

 useEffect(() => {
    // 在 logs 变化时更新总记录数等信息
    setTotalLogs(logs.length);
    setSyncedLogs(logs.filter(log => log.isSynced).length);
    setUnsyncedLogs(logs.filter(log => !log.isSynced).length);
  }, [logs]);


	useEffect(() => {
    calculateTodaySummary();
  }, [logs, startDate, endDate]);

	useEffect(() => {
    if (showTracking) {
      calculateTodaySummary();
    }
  }, [logs, showTracking, startDate, endDate]);


	const calculateTodaySummary = () => {
    const startDateObj = startDate ? new Date(startDate) : null;
    const endDateObj = endDate ? new Date(endDate) : null;

    let filteredLogs;
    if (showTracking) {
      filteredLogs = logs.filter(log => {
          const logDate = new Date(log.created_at);
          if (startDateObj && logDate < startDateObj) return false;
          if (endDateObj && logDate > endDateObj) return false;
          return true;
      });
    } else {
      filteredLogs = []; // 如果 showTracking 为 false，则 filteredLogs 为空数组
    }

    let totalRecords = filteredLogs.length;
		let totalAttempts = 0;
    let totalProfit = 0;
    let totalBetAmount = 0;
    let totalPrizeMultiplier = 0;
    let winningLogCount = 0;
		let totalPrizeAmount = 0;
		let winningEndLogsCount = 0;
		let maxMultiplier = 0;
		let maxMultiplierGame = '';

     filteredLogs.forEach(log => {
      totalAttempts += log.attempts || 0;
      totalProfit += (log.cash_out_amount || 0) - (log.input_amount || 0);
      totalBetAmount += log.bet_amount || 0;

      if (log.bet_amount > 0 && log.prize_amount > 0) {
        const multiplier = log.prize_amount / log.bet_amount;
        totalPrizeMultiplier += multiplier;
        winningLogCount++;

        if (multiplier > maxMultiplier) {
          maxMultiplier = multiplier;
          maxMultiplierGame = log.game_name;
        }
      }
    });

		
		const epsilon = 0.0001; // 设置一个很小的误差范围
		winningEndLogsCount = filteredLogs.filter(log => (parseFloat(log.cash_out_amount) - parseFloat(log.input_amount)) > 0).length;
    const averageBetAmount = filteredLogs.length > 0 ? totalBetAmount / filteredLogs.length : 0;
    const averagePrizeMultiplier = winningLogCount > 0 ? totalPrizeMultiplier / winningLogCount : 0;
    const profitMultiplier = averageBetAmount > 0 ? totalProfit / averageBetAmount : 0;
		const shortTermReturnRate = totalBetAmount > 0 ? (totalPrizeAmount / totalBetAmount) * 100 : 0; // 新增：短期收益率
		const winningLogsCount = filteredLogs.filter(log => log.prize_amount > 0).length; // 新增：送钱老虎记录数

    setTodaySummary({
    totalRecords: totalRecords,
    totalAttempts,
    totalProfit,
    averageBetAmount,
    averagePrizeMultiplier,
    profitMultiplier,
    shortTermReturnRate, // 新增：短期收益率
    winningLogsCount, // 新增：送钱老虎记录数
    winningEndLogsCount,
    maxMultiplierGame: maxMultiplierGame, // 添加 maxMultiplierGame
  });
};

	useEffect(() => {
    if (trackByGameName) {
      const gameNameSummary = calculateGameNameSummary();
      setGameNameSummary(gameNameSummary);
    } else {
      setGameNameSummary([]);
    }
  }, [trackByGameName, filteredLogs]);



	 // 计算最大支付倍数
  const calculateMaxPaymentMultiplier = () => {
    // const today = new Date().toISOString().split('T')[0];
    // const todayLogs = logs.filter(log => log.created_at.startsWith(today));
    const startDateObj = startDate ? new Date(startDate) : null;
    const endDateObj = endDate ? new Date(endDate) : null;

    const filteredLogs = logs.filter(log => {
        const logDate = new Date(log.created_at);
        if (startDateObj && logDate < startDateObj) return false;
        if (endDateObj && logDate > endDateObj) return false;
        return true;
    });

    let maxMultiplier = 0;
    filteredLogs.forEach(log => {
      if (log.bet_amount > 0 && log.prize_amount > 0) {
        const multiplier = log.prize_amount / log.bet_amount;
        maxMultiplier = Math.max(maxMultiplier, multiplier);
      }
    });
    return maxMultiplier.toFixed(2);
  };


  // 计算最大平均支付倍数
  const calculateMaxAveragePaymentMultiplier = () => {
    // const today = new Date().toISOString().split('T')[0];
    // const todayLogs = logs.filter(log => log.created_at.startsWith(today));
    const startDateObj = startDate ? new Date(startDate) : null;
    const endDateObj = endDate ? new Date(endDate) : null;

    const filteredLogs = logs.filter(log => {
        const logDate = new Date(log.created_at);
        if (startDateObj && logDate < startDateObj) return false;
        if (endDateObj && logDate > endDateObj) return false;
        return true;
    });

    let totalBetAmount = 0;
    let maxPrizeAmount = 0;
    let validRecordCount = 0;

    filteredLogs.forEach(log => {
      totalBetAmount += log.bet_amount;
      if (log.prize_amount > maxPrizeAmount) {
        maxPrizeAmount = log.prize_amount;
      }
      validRecordCount++;
    });

    const averageBetAmount = validRecordCount > 0 ? totalBetAmount / validRecordCount : 0;
    const maxAverageMultiplier = averageBetAmount > 0 ? maxPrizeAmount / averageBetAmount : 0;
    return maxAverageMultiplier.toFixed(2);
  };


	// 监听最大平均支付倍数的变化
  useEffect(() => {
    const maxAverageMultiplier = calculateMaxAveragePaymentMultiplier();
    if (parseFloat(maxAverageMultiplier) > 50) {
      window.alert(`最大平均支付倍数已超过 50！当前值为：${maxAverageMultiplier}`);
    }
  }, [logs, startDate, endDate]); // 当 logs 变化时，重新计算并监听
	
	useEffect(() => {
  // 当 logs 发生变化时，更新 gameNames
 		 setGameNames(getUniqueGameNames());
	}, [logs]);



  useEffect(() => {
    openDatabase();
  }, []);

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

  const openDatabase = () => {
    setLoading(true);
    const request = window.indexedDB.open(dbName, dbVersion);

    request.onerror = (event) => {
      console.error('打开 IndexedDB 失败:', event.target.error);
      setErrorMessage('打开本地数据库失败，请重试。');
      setLoading(false);
    };

    request.onsuccess = (event) => {
      const db = event.target.result;
      console.log('IndexedDB 打开成功:', db);
      fetchLogs(db);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(storeName)) {
				const objectStore = db.createObjectStore(storeName, { keyPath: 'id' });
      // 添加索引
        objectStore.createIndex('game_name', 'game_name', { unique: false });
        console.log('IndexedDB 对象存储创建成功:', storeName);
      }
    };
  };

	const calculateGameNameSummary = () => {
  const summary = {};

  filteredLogs.forEach(log => {
    const gameName = log.game_name || '未知游戏'; // 处理游戏名称为空的情况

    if (!summary[gameName]) {
      summary[gameName] = {
        totalRecords: 0,
        winningEndLogsCount: 0,
        totalProfit: 0,
        totalBetAmount: 0,
        totalPrizeAmount: 0,
        maxMultiplier: 0,
      };
    }

    summary[gameName].totalRecords++;
    summary[gameName].totalProfit += (log.cash_out_amount || 0) - (log.input_amount || 0);
    summary[gameName].totalBetAmount += log.bet_amount || 0;

    if ((log.cash_out_amount || 0) - (log.input_amount || 0) > 0) {
      summary[gameName].winningEndLogsCount++;
    }

    if (log.bet_amount > 0 && log.prize_amount > 0) {
      const multiplier = log.prize_amount / log.bet_amount;
      summary[gameName].totalPrizeAmount += log.prize_amount;
      summary[gameName].maxMultiplier = Math.max(summary[gameName].maxMultiplier, multiplier);
    }
  });

  // 转换为数组并计算平均值和百分比
  const summaryArray = Object.entries(summary).map(([gameName, data]) => {
    const averageBetAmount = data.totalRecords > 0 ? data.totalBetAmount / data.totalRecords : 0;
    const shortTermReturnRate = data.totalBetAmount > 0 ? (data.totalPrizeAmount / data.totalBetAmount) * 100 : 0;

    return {
      gameName,
      totalRecords: data.totalRecords,
      winningEndLogsCount: data.winningEndLogsCount,
      totalProfit: data.totalProfit,
      averageBetAmount: averageBetAmount.toFixed(2),
      averagePrizeMultiplier: data.totalBetAmount > 0 ? (data.totalPrizeAmount / data.totalBetAmount).toFixed(2) : 0,
      maxMultiplier: data.maxMultiplier.toFixed(2),
      shortTermReturnRate: shortTermReturnRate.toFixed(2),
    };
  });

  return summaryArray;
};


  const fetchLogs = () => {
    setLoading(true);
    const request = window.indexedDB.open(dbName, dbVersion);

    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const getAllRequest = store.getAll();

      getAllRequest.onsuccess = (event) => {
        let allLogs = event.target.result || [];

				 // 添加 prizeAmountFilter 条件
        let filteredLogs = allLogs; // 定义 filteredLogs 变量
        if (prizeAmountFilter) { // 注意这里的条件取反
          filteredLogs = allLogs.filter(log => log.prize_amount > 0);
        }
				
			const sortedLogs = filteredLogs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setLogs(sortedLogs);
        setFilteredLogs(sortedLogs); // 同时更新 filteredLogs 状态
        setTotalLogs(allLogs.length); // 使用 allLogs 计算总记录数
        setSyncedLogs(allLogs.filter(log => log.isSynced).length); // 使用 allLogs 计算已同步记录数
        setUnsyncedLogs(allLogs.filter(log => !log.isSynced).length); // 使用 allLogs 计算未同步记录数
        setLoading(false);
      };

      getAllRequest.onerror = (event) => {
        console.error('获取 IndexedDB 数据失败:', event.target.error);
        setErrorMessage('获取本地数据失败，请重试。');
        setLoading(false);
      };
    };

    request.onerror = (event) => {
      console.error('打开 IndexedDB 失败:', event.target.error);
      setErrorMessage('打开本地数据库失败，请重试。');
      setLoading(false);
    };
  };

		useEffect(() => {
    fetchLogs(); // 组件加载时获取数据
  }, [prizeAmountFilter]);

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

    const handleSubmit = (e) => {
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
      isSynced: false,
    };

    setLoading(true);
    const request = window.indexedDB.open(dbName, dbVersion);

    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const addRequest = store.add(newLog);

      addRequest.onsuccess = () => {
        console.log('IndexedDB 数据添加成功:', newLog);
        setSuccessMessage('打老虎记录添加成功!');
        setInputAmount('100');
        setCashOutAmount('');
        setMainPhoto(null);
        setWinningPhotos([]);
        setAttempts('');
        setEncounteredTrailer(true);
        setBetAmount('');
        setPrizeAmount(0);
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
        fetchLogs(db);
      };

      addRequest.onerror = (event) => {
        console.error('IndexedDB 数据添加失败:', event.target.error);
        setErrorMessage('添加本地数据失败，请重试。');
        setLoading(false);
      };
    };

    request.onerror = (event) => {
      console.error('打开 IndexedDB 失败:', event.target.error);
      setErrorMessage('打开本地数据库失败，请重试。');
      setLoading(false);
    };
  };

  const handleBackToModules = () => {
    navigate('/modules');
  };

  const handleViewHistory = () => {
    setShowHistory(!showHistory);
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
      handleInputFocus('attempts', attemptsInputRef.current);
    } else if (activeInput === 'attempts') {
      handleInputFocus('prizeAmount', prizeInputRef.current);
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

  const handleSync = async () => {
    setSyncing(true);
    setSyncMessage('正在同步数据...');
    if (!userId) {
      setShowLoginModal(true);
      setSyncing(false);
      return;
    }
    try {
      const request = window.indexedDB.open(dbName, dbVersion);

      request.onsuccess = async (event) => {
        const db = event.target.result;
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const getAllRequest = store.getAll();

        getAllRequest.onsuccess = async (event) => {
          const logsToSync = (event.target.result || []).filter(log => !log.isSynced);
          if (logsToSync.length === 0) {
            setSyncMessage('所有数据已同步。');
            setSyncing(false);
            return;
          }

          for (const log of logsToSync) {
            const { data, error } = await supabase
              .from('tiger_game_logs')
              .insert([{
                user_id: userId,
								game_name: log.game_name, // 添加游戏名称
                input_amount: log.input_amount,
                cash_out_amount: log.cash_out_amount,
                main_photo: log.main_photo,
                winning_photos: log.winning_photos,
                created_at: log.created_at,
                attempts: log.attempts,
                encountered_trailer: log.encountered_trailer,
                bet_amount: log.bet_amount,
                prize_amount: log.prize_amount,
              }]);

            if (error) {
              console.error('同步数据到 Supabase 时发生错误:', error);
              setSyncMessage(`同步数据失败，请重试。错误信息: ${error.message}`);
              setSyncing(false);
              return;
            } else {
              console.log('数据同步成功:', data);
              const updatedLog = { ...log, isSynced: true };
              const updateTransaction = db.transaction(storeName, 'readwrite');
              const updateStore = updateTransaction.objectStore(storeName);
              const updateRequest = updateStore.put(updatedLog);

              updateRequest.onsuccess = () => {
                console.log('IndexedDB 数据更新成功:', updatedLog);
                fetchLogs(db);
              };

              updateRequest.onerror = (event) => {
                console.error('IndexedDB 数据更新失败:', event.target.error);
                setErrorMessage('更新本地数据失败，请重试。');
              };
            }
          }
          setSyncMessage('数据同步成功！');
          setSyncing(false);
        };

        getAllRequest.onerror = (event) => {
          console.error('获取 IndexedDB 数据失败:', event.target.error);
          setErrorMessage('获取本地数据失败，请重试。');
          setSyncing(false);
        };
      };

      request.onerror = (event) => {
        console.error('打开 IndexedDB 失败:', event.target.error);
        setErrorMessage('打开本地数据库失败，请重试。');
        setSyncing(false);
      };
    } catch (error) {
      console.error('同步数据时发生意外错误:', error);
      setSyncMessage(`同步数据失败，请重试。错误信息: ${error.message}`);
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

    const handleClearData = async () => {
    setShowClearModal(true);
    try {
      const quota = await navigator.storage.estimate();
      setIndexedDBQuota(quota);
    } catch (error) {
      console.error('获取 IndexedDB 配额失败:', error);
      setIndexedDBQuota(null);
    }
  };


  const handleConfirmClearData = () => {
  setLoading(true);
  const request = window.indexedDB.open(dbName, dbVersion);

  request.onsuccess = (event) => {
    const db = event.target.result;
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);

    if (clearOption === 'synced') {
      const getAllRequest = store.getAll();
      getAllRequest.onsuccess = (event) => {
        const allLogs = event.target.result || [];
        const syncedLogsToDelete = allLogs.filter(log => log.isSynced);

        const deleteRequests = syncedLogsToDelete.map(log => store.delete(log.id));

        Promise.all(deleteRequests.map(req => new Promise((resolve, reject) => {
          req.onsuccess = resolve;
          req.onerror = reject;
        }))).then(() => {
          console.log('已同步数据清空成功');
          fetchLogs(db);
          setLoading(false);
          // setShowClearModal(false); // REMOVED: 移除这行代码
          try {
            // 关闭数据库连接
            db.close();
            // 重新打开数据库连接
            const newRequest = window.indexedDB.open(dbName, dbVersion);
            newRequest.onsuccess = async (event) => {
              const newDb = event.target.result;
              const quota = await navigator.storage.estimate();
              setIndexedDBQuota(quota);
              newDb.close();
            };
            newRequest.onerror = (event) => {
              console.error('重新打开 IndexedDB 失败:', event.target.error);
              setErrorMessage('重新打开本地数据库失败，请重试。');
              setIndexedDBQuota(null);
            };
          } catch (error) {
            console.error('获取 IndexedDB 配额失败:', error);
            setIndexedDBQuota(null);
          }
        }).catch(error => {
          console.error('清空已同步数据时发生错误:', error);
          setErrorMessage('清空已同步数据失败，请重试。');
          setLoading(false);
        });
      };
      getAllRequest.onerror = (event) => {
        console.error('获取 IndexedDB 数据失败:', event.target.error);
        setErrorMessage('获取本地数据失败，请重试。');
        setLoading(false);
      };
    } else {
      const clearRequest = store.clear();
      clearRequest.onsuccess = async () => {
        console.log('IndexedDB 数据清空成功');
        setLogs([]);
        setTotalLogs(0);
        setSyncedLogs(0);
        setUnsyncedLogs(0);
        setLoading(false);
         // setShowClearModal(false); // 移除这行代码
        try {
          // 关闭数据库连接
          db.close();
          // 重新打开数据库连接
          const newRequest = window.indexedDB.open(dbName, dbVersion);
          newRequest.onsuccess = async (event) => {
            const newDb = event.target.result;
            const quota = await navigator.storage.estimate();
            setIndexedDBQuota(quota);
            newDb.close();
          };
          newRequest.onerror = (event) => {
            console.error('重新打开 IndexedDB 失败:', event.target.error);
            setErrorMessage('重新打开本地数据库失败，请重试。');
            setIndexedDBQuota(null);
          };
        } catch (error) {
          console.error('获取 IndexedDB 配额失败:', error);
          setIndexedDBQuota(null);
        }
      };

      clearRequest.onerror = (event) => {
        console.error('IndexedDB 数据清空失败:', event.target.error);
        setErrorMessage('清空本地数据失败，请重试。');
        setLoading(false);
      };
    }
  };

  request.onerror = (event) => {
    console.error('打开 IndexedDB 失败:', event.target.error);
    setErrorMessage('打开本地数据库失败，请重试。');
    setLoading(false);
  };
};


	const handleCancelClearData = () => {
    setShowClearModal(false);
  };

	const handleSort = (column) => {
  if (sortColumn === column) {
    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
  } else {
    setSortColumn(column);
    setSortDirection('asc');
  }
};


  return (
     <div className="container" ref={inputRef}>
      <h2>打虎日记 (离线版)</h2>
       <form onSubmit={handleSubmit}>
        <div className="form-group">
          <div className="file-input-container" style={{ marginTop: '20px' }}>
	      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
        <label style={{ marginRight: '10px' }}>
          启用数字键盘:
          <input
            type="checkbox"
            checked={isKeyboardEnabled}
            onChange={() => setIsKeyboardEnabled(!isKeyboardEnabled)}
          />
        </label>
        <label>
          启动追踪:
          <input
            type="checkbox"
            checked={showTracking}
            onChange={() => setShowTracking(!showTracking)}
          />
        </label>
					<label style={{ marginLeft: '10px' }}>
  个性化指标:
  <input
    type="checkbox"
    checked={showSharpeKelly}
    onChange={() => {
			setShowSharpeKelly(!showSharpeKelly)
			updateMetrics()
				}}
  />
</label>
      </div>
            <input
              type="file"
              id="mainPhoto"
              accept="image/*"
              onChange={handleMainPhotoChange}
              ref={fileInputRef}
              style={{ display: 'none' }}
            />
						{showTracking && (
			 <>
    <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '10px' }}>
      <label>开始时间:</label>
      <input
        type="datetime-local"
        value={startDate}
        onChange={(e) => setStartDate(e.target.value)}
      />
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '10px' }}>
      <label>结束时间:</label>
      <input
        type="datetime-local"
        value={endDate}
        onChange={(e) => setEndDate(e.target.value)}
      />
    </div>
		<div className="form-group">
  <label>
    按游戏名称追踪
    <input
      type="checkbox"
      checked={trackByGameName}
      onChange={() => setTrackByGameName(!trackByGameName)}
    />
  </label>
</div>

		<table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
    <thead>
      <tr>
        <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>自定义指标</th>
        <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>数值</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style={{ border: '1px solid #ddd', padding: '8px' }}>总记录数</td>
        <td style={{ border: '1px solid #ddd', padding: '8px' }}>{todaySummary.totalRecords}</td>
      </tr>
      <tr>
        <td style={{ border: '1px solid #ddd', padding: '8px' }}>总尝试次数</td>
        <td style={{ border: '1px solid #ddd', padding: '8px' }}>{todaySummary.totalAttempts}</td>
      </tr>
			<tr>
      <td style={{ border: '1px solid #ddd', padding: '8px' }}>赢钱结束记录总数</td> {/* 新增：送钱老虎记录数 */}
      <td style={{ border: '1px solid #ddd', padding: '8px' }}>{todaySummary.winningLogsCount}</td> {/* 新增：送钱老虎记录数 */}
    	</tr>
      <tr>
        <td style={{ border: '1px solid #ddd', padding: '8px' }}>盈亏总额</td>
        <td style={{ border: '1px solid #ddd', padding: '8px' }}>{todaySummary.totalProfit.toFixed(2)}</td>
      </tr>
      <tr>
        <td style={{ border: '1px solid #ddd', padding: '8px' }}>平均下注金额</td>
        <td style={{ border: '1px solid #ddd', padding: '8px' }}>{todaySummary.averageBetAmount.toFixed(2)}</td>
      </tr>
      <tr>
        <td style={{ border: '1px solid #ddd', padding: '8px' }}>平均支付倍数</td>
        <td style={{ border: '1px solid #ddd', padding: '8px' }}>{todaySummary.averagePrizeMultiplier.toFixed(2)}</td>
      </tr>
      <tr>
        <td style={{ border: '1px solid #ddd', padding: '8px' }}>最大支付倍数</td>
        <td style={{ border: '1px solid #ddd', padding: '8px' }}>{calculateMaxPaymentMultiplier()}</td>
      </tr>
			<tr>
 				 <td style={{ border: '1px solid #ddd', padding: '8px' }}>最大方的游戏</td>
  			 <td style={{ border: '1px solid #ddd', padding: '8px' }}>{todaySummary.maxMultiplierGame}</td>
			</tr>
      <tr>
        <td style={{ border: '1px solid #ddd', padding: '8px' }}>最大平均支付倍数</td>
        <td style={{ border: '1px solid #ddd', padding: '8px' }}>{calculateMaxAveragePaymentMultiplier()}</td>
      </tr>
      <tr>
        <td style={{ border: '1px solid #ddd', padding: '8px' }}>盈亏倍数</td>
        <td style={{ border: '1px solid #ddd', padding: '8px' }}>{todaySummary.profitMultiplier.toFixed(2)}</td>
      </tr>
			<tr>
      <td style={{ border: '1px solid #ddd', padding: '8px' }}>短期收益率</td> {/* 新增：短期收益率 */}
      <td style={{ border: '1px solid #ddd', padding: '8px' }}>{todaySummary.shortTermReturnRate.toFixed(2)}%</td> {/* 新增：短期收益率 */}
    	</tr>
    </tbody>
  </table>
			 </>
			   )}
						{showSharpeKelly && (
  <div style={{ marginTop: '10px' }}>
    <p style={{ color: kellyCriterion < 0 ? 'red' : 'inherit' }}>凯利值: {kellyCriterion.toFixed(2)}</p>
    <p>夏普比率: {sharpeRatio.toFixed(2)}</p>
  </div>
)}
						{trackByGameName && (
  <div className="inspiration-list">
    <h3>按游戏名称追踪</h3>
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr>
          <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left', cursor: 'pointer' }} onClick={() => handleSort('gameName')}>游戏名称</th>
          <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left', cursor: 'pointer' }} onClick={() => handleSort('totalRecords')}>总记录数</th>
          <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left', cursor: 'pointer' }} onClick={() => handleSort('winningEndLogsCount')}>赢钱结束记录总数</th>
          <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left', cursor: 'pointer' }} onClick={() => handleSort('totalProfit')}>盈亏总额</th>
          <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left', cursor: 'pointer' }} onClick={() => handleSort('averageBetAmount')}>平均下注金额</th>
          <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left', cursor: 'pointer' }} onClick={() => handleSort('averagePrizeMultiplier')}>平均支付倍数</th>
          <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left', cursor: 'pointer' }} onClick={() => handleSort('maxMultiplier')}>最大支付倍数</th>
          <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left', cursor: 'pointer' }} onClick={() => handleSort('shortTermReturnRate')}>短期收益率</th>
        </tr>
      </thead>
      <tbody>
        {gameNameSummary.sort((a, b) => {
            const sortOrder = sortDirection === 'asc' ? 1 : -1;
            if (sortColumn === 'gameName') {
                return sortOrder * a.gameName.localeCompare(b.gameName, 'zh-CN');
            }
            return sortOrder * (a[sortColumn] - b[sortColumn]);
        }).map((item) => (
          <tr key={item.gameName}>
            <td style={{ border: '1px solid #ddd', padding: '8px' }}>{item.gameName}</td>
            <td style={{ border: '1px solid #ddd', padding: '8px' }}>{item.totalRecords}</td>
            <td style={{ border: '1px solid #ddd', padding: '8px' }}>{item.winningEndLogsCount}</td>
            <td style={{ border: '1px solid #ddd', padding: '8px' }}>{item.totalProfit.toFixed(2)}</td>
            <td style={{ border: '1px solid #ddd', padding: '8px' }}>{item.averageBetAmount}</td>
            <td style={{ border: '1px solid #ddd', padding: '8px' }}>{item.averagePrizeMultiplier}</td>
            <td style={{ border: '1px solid #ddd', padding: '8px' }}>{item.maxMultiplier}</td>
            <td style={{ border: '1px solid #ddd', padding: '8px' }}>{item.shortTermReturnRate}%</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)}


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
    
  </div>
				<div className="form-group">
  <label htmlFor="gameName">游戏名称:</label>
  <input
    type="text"
    id="gameName"
    value={gameName}
    onChange={(e) => setGameName(e.target.value)}
    ref={gameNameInputRef}
    list="gameNames"
  />
  <datalist id="gameNames">
    {getUniqueGameNames().map((name) => (
      <option key={name} value={name} />
    ))}
  </datalist>
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
          {prizeAmount !== 0 && ( // 条件渲染
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
			 <button type="button" onClick={handleViewHistory} style={{ marginTop: '20px', backgroundColor: '#28a745' }}>
        {showHistory ? '隐藏历史记录' : '显示历史记录'}
      </button>
      <button type="button" onClick={handleClearData} style={{ marginTop: '20px', backgroundColor: '#dc3545' }}>
         清空数据
      </button>
      {showClearModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>清空数据</h2>
            {indexedDBQuota && (
              <p>
                IndexedDB 可用空间: {(indexedDBQuota.usage / 1024).toFixed(2)} KB / {(indexedDBQuota.quota / 1024).toFixed(2)} KB
              </p>
            )}
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
			  {showHistory && (
  <div className="inspiration-list">
    <h3>历史记录</h3>
    <p>
      <strong>总记录数:</strong> {totalLogs}
    </p>
    <p>
      <strong>已同步记录数:</strong> {syncedLogs}
    </p>
    <p>
      <strong>未同步记录数:</strong> {unsyncedLogs}
    </p>
    <div>
      <label>
        只显示送钱老虎
        <input
          type="checkbox"
          checked={prizeAmountFilter}
          onChange={() => {
            setPrizeAmountFilter(!prizeAmountFilter);
          }}
        />
      </label>
    </div>
    {logs.map((log) => (
      <div key={log.id} className="inspiration-item">
        {editingLogId === log.id ? (
          // 编辑模式
          <>
    <div className="form-group">
      <label htmlFor="editedGameName">游戏名称:</label>
      <input
        type="text"
        id="editedGameName"
        value={editedGameName}
        onChange={(e) => setEditedGameName(e.target.value)}
      />
    </div>
    <div className="form-group">
      <label htmlFor="editedInputAmount">投入金额:</label>
      <input
        type="number"
        id="editedInputAmount"
        value={editedInputAmount}
        onChange={(e) => setEditedInputAmount(e.target.value)}
      />
    </div>
    <div className="form-group">
      <label htmlFor="editedBetAmount">下注金额:</label>
      <input
        type="number"
        id="editedBetAmount"
        value={editedBetAmount}
        onChange={(e) => setEditedBetAmount(e.target.value)}
      />
    </div>
    <div className="form-group">
      <label htmlFor="editedPrizeAmount">中奖金额:</label>
      <input
        type="number"
        id="editedPrizeAmount"
        value={editedPrizeAmount}
        onChange={(e) => setEditedPrizeAmount(e.target.value)}
      />
    </div>
    <div className="form-group">
      <label htmlFor="editedCashOutAmount">兑换金额:</label>
      <input
        type="number"
        id="editedCashOutAmount"
        value={editedCashOutAmount}
        onChange={(e) => setEditedCashOutAmount(e.target.value)}
      />
    </div>
    <div className="form-group">
      <label htmlFor="editedAttempts">尝试次数:</label>
      <input
        type="number"
        id="editedAttempts"
        value={editedAttempts}
        onChange={(e) => setEditedAttempts(e.target.value)}
      />
    </div>
    <div className="form-group">
      <label>
        遇到预告片:
        <input
          type="checkbox"
          name="editedEncounteredTrailer"
          checked={editedEncounteredTrailer}
          onChange={() => setEditedEncounteredTrailer(!editedEncounteredTrailer)}
        />
      </label>
    </div>
    <div className="edit-buttons">
      <button onClick={() => handleSaveEdit(log)} disabled={loading}>
        {loading ? "保存中..." : "保存"}
      </button>
      <button onClick={handleCancelEdit} disabled={loading}>
        取消
      </button>
            </div>
          </>
        ) : (
          // 查看模式
          <>
            <p>
              <strong>游戏名称:</strong> {log.game_name}
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
              <strong>下注金额:</strong> {log.bet_amount}
            </p>
            <p>
              <strong>中奖金额:</strong> {log.prize_amount}
            </p>
            <p>
              <strong>兑换金额:</strong> {log.cash_out_amount}
            </p>
            <p>
              <strong>盈亏金额:</strong> {(log.cash_out_amount - log.input_amount).toFixed(2)}
            </p>
            <p>
              <strong>尝试次数:</strong> {log.attempts}
            </p>
            <p>
              <strong>遇到预告片:</strong> {log.encountered_trailer ? '是' : '否'}
            </p>
            {log.main_photo && <img src={log.main_photo} alt="Main Log" style={{ maxWidth: '100%', maxHeight: '300px', display: 'block', objectFit: 'contain' }} />}
            <div style={{ display: 'flex', flexWrap: 'wrap' }}>
              {log.winning_photos &&
                log.winning_photos.map((photo, index) => (
                  <img key={index} src={photo} alt={`Winning Log ${index + 1}`} style={{ maxWidth: '100%', maxHeight: '150px', display: 'block', objectFit: 'contain', marginRight: '5px', marginBottom: '5px' }} />
                ))}
            </div>
            <div className="edit-buttons">
              <button onClick={() => handleEditLog(log)} disabled={loading}>
                编辑
              </button>
              <button onClick={() => handleDeleteLog(log.id)} disabled={loading}>
   						 {confirmDeleteId === log.id ? '确认删除' : '删除'}
              </button>
            </div>
          </>
        )}
      </div>
    ))}
  </div>
)}
			 </div>
  );
}

export default OfflineTigerGamePage;
