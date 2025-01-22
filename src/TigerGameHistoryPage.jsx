import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import imageCompression from 'browser-image-compression';

const supabaseUrl = 'https://fhcsffagxchzpxouuiuq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZoY3NmZmFneGNoenB4b3V1aXVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzYyMTQzMzAsImV4cCI6MjA1MTc5MDMzMH0.1DMl870gjGRq5LRlQMES9WpYWehiKiPIea2Yj1q4Pz8';
const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        persistSession: false
    },
    fetch: (input, init) => {
        return fetch(input, { ...init, timeout: 30000 });
    }
});

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
    const chartCanvasRef = useRef(null);
    const scatterCanvasRef = useRef(null);
    const [showChart, setShowChart] = useState(false);
    const [filteredLogs, setFilteredLogs] = useState([]);
    const [encounteredTrailer, setEncounteredTrailer] = useState(false);
    const containerRef = useRef(null);
    const [chartWidth, setChartWidth] = useState(600);
    const [betAmount, setBetAmount] = useState('');
    const [prizeAmount, setPrizeAmount] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [logsPerPage] = useState(3);
    const [totalLogs, setTotalLogs] = useState(0);
    const [showPhotos, setShowPhotos] = useState({});

    useEffect(() => {
        setSortedLogs([...logs].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
    }, [logs]);

    useEffect(() => {
        const filtered = logs.filter((log) => {
            const logTime = new Date(log.created_at).getTime();
            const startTime = startDate ? new Date(startDate).getTime() : 0;
            const endTime = endDate ? new Date(endDate).getTime() : Infinity;
            return logTime >= startTime && logTime <= endTime;
        });
        setFilteredLogs(filtered);
    }, [logs, startDate, endDate]);

    useEffect(() => {
        if (containerRef.current) {
            setChartWidth(containerRef.current.offsetWidth - 40);
        }
    }, []);

    useEffect(() => {
        if (logs.length > 0 && showChart) {
            drawChart();
            drawScatterPlot();
        }
    }, [logs, startDate, endDate, showChart, chartWidth]);

    useEffect(() => {
        if (logs.length > 0) {
            setShowPhotos(logs.reduce((acc, log) => ({ ...acc, [log.id]: false }), {}));
        }
    }, [logs]);

const fetchLogs = async (fetchOnlyCount = false) => {
    setErrorMessage('');
    try {
        let countQuery = supabase
            .from('tiger_game_logs')
            .select('*', { count: 'exact' })
            .eq('user_id', loggedInUser.id);

        if (startDate) {
            countQuery = countQuery.gte('created_at', `${startDate}:00.000Z`);
        }
        if (endDate) {
            countQuery = countQuery.lt('created_at', `${endDate}:00.000Z`);
        }

        const { count, error: countError } = await countQuery;

        if (countError) {
            console.error('获取打老虎记录总数时发生错误:', countError);
            setErrorMessage('获取打老虎记录总数失败。');
            return;
        }

        setTotalLogs(count);

        if (fetchOnlyCount) {
            setLogs([]);
            setFilteredLogs([]);
            // ADDED: 计算并设置指标
            let query = supabase
                .from('tiger_game_logs')
                .select('*')
                .eq('user_id', loggedInUser.id);

            if (startDate) {
                query = query.gte('created_at', `${startDate}:00.000Z`);
            }
            if (endDate) {
                query = query.lt('created_at', `${endDate}:00.000Z`);
            }

            const { data, error } = await query;

            if (error) {
                console.error('获取打老虎记录时发生错误:', error);
                setErrorMessage('获取打老虎记录失败。');
                return;
            }
            setFilteredLogs(data);
            return;
        }

        const startIndex = (currentPage - 1) * logsPerPage;
        const endIndex = startIndex + logsPerPage - 1;

        let query = supabase
            .from('tiger_game_logs')
            .select('*')
            .eq('user_id', loggedInUser.id)
            .order('created_at', { ascending: false });

        if (startDate) {
            query = query.gte('created_at', `${startDate}:00.000Z`);
        }
        if (endDate) {
            query = query.lt('created_at', `${endDate}:00.000Z`);
        }

        query = query.range(startIndex, endIndex);

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
        return filteredLogs.reduce(
            (total, log) => total + (log.cash_out_amount - log.input_amount),
            0,
        ).toFixed(2);
    };

    const calculateAverageAttempts = () => {
        if (filteredLogs.length === 0) return 0;
        const totalAttempts = filteredLogs.reduce((sum, log) => sum + log.attempts, 0);
        return (totalAttempts / filteredLogs.length).toFixed(2);
    };

    const calculateEncounteredTrailerPercentage = () => {
        if (filteredLogs.length === 0) return '0.00%';

        const encounteredTrailerCount = filteredLogs.filter(log => log.encountered_trailer).length;
        const percentage = (encounteredTrailerCount / filteredLogs.length) * 100;
        return percentage.toFixed(2) + '%';
    };

    const calculateAverageAttemptsForWins = () => {
        const winningLogs = filteredLogs.filter(log => (log.cash_out_amount - log.input_amount) > 0);
        if (winningLogs.length === 0) return 0;
        const totalAttempts = winningLogs.reduce((sum, log) => sum + log.attempts, 0);
        return (totalAttempts / winningLogs.length).toFixed(2);
    };

    const calculateAverageAttemptsForLosses = () => {
        const losingLogs = filteredLogs.filter(log => (log.cash_out_amount - log.input_amount) < 0);
        if (losingLogs.length === 0) return 0;
        const totalAttempts = losingLogs.reduce((sum, log) => sum + log.attempts, 0);
        return (totalAttempts / losingLogs.length).toFixed(2);
    };

    const calculateAverageAttemptsWithTrailer = () => {
        const trailerLogs = filteredLogs.filter(log => log.encountered_trailer);
        if (trailerLogs.length === 0) return 0;
        const totalAttempts = trailerLogs.reduce((sum, log) => sum + log.attempts, 0);
        return (totalAttempts / trailerLogs.length).toFixed(2);
    };

    const calculateAveragePrizeMultiplier = () => {
        if (filteredLogs.length === 0) return 0;
        let validLogs = filteredLogs.filter(log => log.bet_amount > 0);
        if (validLogs.length === 0) return 0;
        const totalMultiplier = validLogs.reduce((sum, log) => sum + (log.prize_amount / log.bet_amount), 0);
        return (totalMultiplier / validLogs.length).toFixed(2);
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
        setEncounteredTrailer(log.encountered_trailer);
        setBetAmount(log.bet_amount);
        setPrizeAmount(log.prize_amount);
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
            encountered_trailer: encounteredTrailer,
            bet_amount: parseFloat(betAmount),
            prize_amount: parseFloat(prizeAmount),
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
                setEncounteredTrailer(false);
                setBetAmount('');
                setPrizeAmount('');
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
            } else if (e.target.id === 'betAmount') {
                setBetAmount(e.target.value);
            } else if (e.target.id === 'prizeAmount') {
                setPrizeAmount(e.target.value);
            }
        }
    };

    const handleRemoveWinningPhoto = (indexToRemove) => {
        if (window.confirm('确定要删除此照片吗？此操作不可恢复。')) {
            setTempWinningPhotos((prevPhotos) => {
                if (Array.isArray(prevPhotos)) {
                    return prevPhotos.filter((_, index) => index !== indexToRemove)
                }
                return [];
            });
        }
    };

    const handleBackToModules = () => {
        navigate('/modules');
    };

    const drawChart = () => {
        if (!chartCanvasRef.current) return;
        const canvas = chartCanvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const dailyData = {};
        filteredLogs.forEach(log => {
            const date = new Date(log.created_at).toLocaleDateString();
            const profit = log.cash_out_amount - log.input_amount;
            dailyData[date] = (dailyData[date] || 0) + profit;
        });

        const dates = Object.keys(dailyData);
        const profits = Object.values(dailyData);

        if (dates.length === 0) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            return;
        }

        const barWidth = canvas.width / dates.length;
        const maxProfit = Math.max(...profits, 0);
        const minProfit = Math.min(...profits, 0);
        const range = maxProfit - minProfit;
        const padding = 40;
        const zeroY = canvas.height - padding - (range === 0 ? 0 : (0 - minProfit) / range * (canvas.height - 2 * padding));

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw x-axis
        ctx.beginPath();
        ctx.moveTo(padding, zeroY);
        ctx.lineTo(canvas.width - padding, zeroY);
        ctx.stroke();

        // Draw y-axis
        ctx.beginPath();
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, canvas.height - padding);
        ctx.stroke();

        // Draw bars
        dates.forEach((date, index) => {
            const x = padding + index * barWidth;
            const profit = profits[index];
            const barHeight = range === 0 ? 0 : (profit) / range * (canvas.height - 2 * padding);
            const y = zeroY - barHeight;

            ctx.fillStyle = profit > 0 ? 'green' : 'red';
            ctx.fillRect(x, y, barWidth - 2, barHeight);

            ctx.fillStyle = 'black';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(date, x + barWidth / 2, canvas.height - 5);
            ctx.fillText(profit.toFixed(2), x + barWidth / 2, y - 5);
        });

        // Add chart title
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('每日盈亏图', canvas.width / 2, padding / 2);

        // Add y-axis label
        ctx.save();
        ctx.translate(padding / 2, canvas.height / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.textAlign = 'center';
        ctx.fillText('盈亏金额', 0, 0);
        ctx.restore();
    };

    const drawScatterPlot = () => {
        if (!scatterCanvasRef.current) return;
        const canvas = scatterCanvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        if (filteredLogs.length === 0) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            return;
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const profits = filteredLogs.map(log => log.cash_out_amount - log.input_amount);
        const attempts = filteredLogs.map(log => log.attempts);

        const maxProfit = Math.max(...profits, 0);
        const minProfit = Math.min(...profits, 0);
        const maxAttempts = Math.max(...attempts, 0);
        const minAttempts = Math.min(...attempts, 0);

        const profitRange = maxProfit - minProfit;
        const attemptsRange = maxAttempts - minAttempts;

        const padding = 40;

        // Draw x-axis
        ctx.beginPath();
        ctx.moveTo(padding, canvas.height - padding);
        ctx.lineTo(canvas.width - padding, canvas.height - padding);
        ctx.stroke();

        // Draw y-axis
        ctx.beginPath();
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, canvas.height - padding);
        ctx.stroke();

        filteredLogs.forEach((log, index) => {
            const profit = profits[index];
            const attempt = attempts[index];

            const x = attemptsRange === 0 ? padding : padding + (attempt - minAttempts) / attemptsRange * (canvas.width - 2 * padding);
            const y = profitRange === 0 ? canvas.height - padding : canvas.height - padding - (profit - minProfit) / profitRange * (canvas.height - 2 * padding);

            ctx.beginPath();
            ctx.arc(x, y, 3, 0, 2 * Math.PI);
            ctx.fillStyle = profit > 0 ? 'green' : 'red';
            ctx.fill();

            ctx.fillStyle = 'black';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(profit.toFixed(2), x, y - 5);
            ctx.fillText(attempt, x, canvas.height - padding + 10);
        });

        // Add chart title
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('盈亏 vs 尝试次数', canvas.width / 2, padding / 2);

        // Add x-axis label
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('尝试次数', canvas.width / 2, canvas.height - 5);

        // Add y-axis label
        ctx.save();
        ctx.translate(padding / 2, canvas.height / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.textAlign = 'center';
        ctx.fillText('盈亏金额', 0, 0);
        ctx.restore();
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setConfirmDeleteId(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <div className="container" ref={containerRef}>
            <h2>打过的老虎们</h2>
            {loggedInUser && <p>当前用户: {loggedInUser.username}</p>}
            <button type="button" onClick={onLogout} className="logout-button">退出</button>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
                <button type="button" onClick={() => navigate('/tiger-game')} className="select-file-button" style={{ marginTop: '20px' }}>
                    返回打虎日记
                </button>
                <button type="button" onClick={handleBackToModules} style={{ marginTop: '10px', backgroundColor: '#6c757d' }}>返回神奇百宝箱</button>
            </div>
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
            <div className="form-group">
    <button type="button" onClick={() => fetchLogs(true)} style={{ marginTop: '10px', backgroundColor: '#28a745' }}>查询</button>
</div>
<p>
    <strong>符合条件的记录数:</strong> {totalLogs}
</p>
<p>
    <strong>平均中奖倍数:</strong> {calculateAveragePrizeMultiplier()}
</p>
<div className="form-group" style={{ display: 'flex', alignItems: 'center' }}>
    <label style={{ marginBottom: '0', marginRight: '10px' }}>
        <strong>盈亏总额:</strong> {calculateTotalProfit()}
    </label>
    <label style={{ marginBottom: '0', marginRight: '10px' }}>
        显示图表
        <input
            type="checkbox"
            checked={showChart}
            onChange={() => setShowChart(!showChart)}
            style={{ width: 'auto', margin: '0' }}
        />
    </label>
</div>
{showChart && <canvas ref={chartCanvasRef} width={chartWidth} height={200} style={{ border: '1px solid #ddd', marginTop: '20px' }}></canvas>}
{showChart && <canvas ref={scatterCanvasRef} width={chartWidth} height={200} style={{ border: '1px solid #ddd', marginTop: '20px' }}></canvas>}
<div style={{ overflowX: 'auto' }}>
    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
        <thead>
            <tr>
                <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>指标</th>
                <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>平均尝试次数</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>打过的老虎</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{calculateAverageAttempts()}</td>
            </tr>
            <tr>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>送钱老虎</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{calculateAverageAttemptsForWins()}</td>
            </tr>
            <tr>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>吃钱老虎</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{calculateAverageAttemptsForLosses()}</td>
            </tr>
            <tr>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>遇到预告片</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{calculateAverageAttemptsWithTrailer()}</td>
            </tr>
        </tbody>
    </table>
</div>
<p>
    <strong>遇到预告片占比:</strong> {calculateEncounteredTrailerPercentage()}
</p>

<div className="sort-buttons">
    <button type="button" onClick={handleSortByProfit} className="sort-button">
        按盈亏金额排序
    </button>
    <button type="button" onClick={handleSortByAttempts} className="sort-button">
        按尝试次数排序
    </button>
</div>
<button type="button" onClick={() => setShowPhotos(logs.reduce((acc, log) => ({ ...acc, [log.id]: true }), {}))}>
    显示全部图片
</button>
<button type="button" onClick={() => {setCurrentPage(1); fetchLogs(false)}} style={{ marginTop: '10px', backgroundColor: '#007bff' }}>显示历史记录</button>

            {logs.length > 0 && (
                sortedLogs.map((log, index) => (
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
                        <label>
                            显示图片
                            <input
                                type="checkbox"
                                checked={showPhotos[log.id] || false}
                                onChange={() => setShowPhotos(prev => ({ ...prev, [log.id]: !prev[log.id] }))}
                            />
                        </label>
                        {log.main_photo && showPhotos[log.id] && <img src={log.main_photo} alt="Main Log" style={{ maxWidth: '100%', maxHeight: '300px', display: 'block', objectFit: 'contain' }} />}
                        <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                            {log.winning_photos &&
                                log.winning_photos.map((photo, index) => (
                                    <div key={index} style={{ position: 'relative', display: 'inline-block', marginRight: '5px', marginBottom: '5px' }}>
                                        {showPhotos[log.id] && <img src={photo} alt={`Winning Log ${index + 1}`} style={{ maxWidth: '100%', maxHeight: '150px', display: 'block', objectFit: 'contain' }} />}
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
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
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
                                        <label>下注金额:</label>
                                        <input
                                            type="number"
                                            id="betAmount"
                                            value={betAmount}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>中奖金额:</label>
                                        <input
                                            type="number"
                                            id="prizeAmount"
                                            value={prizeAmount}
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
                                    <button type="submit" className="select-file-button" style={{ padding: '10px 15px' }}>更新</button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setEditingLogId(null);
                                            navigate('/tiger-game/history');
                                        }}
                                        className="select-file-button" style={{ backgroundColor: '#dc3545', padding: '10px 15px' }}
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
                ))
            )}
            <div className="pagination">
                <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                >
                    上一页
                </button>
                <span>{currentPage}</span>
                <button
                    onClick={() => setCurrentPage(prev => prev + 1)}
                    disabled={logs.length < logsPerPage || (currentPage * logsPerPage >= totalLogs)}
                >
                    下一页
                </button>
            </div>
        </div>
    );
}

export default TigerGameHistory;
