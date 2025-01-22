import React, { useState, useEffect } from 'react';
    import { Link, useNavigate } from 'react-router-dom';

    function History() {
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
        navigate('/history');
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
