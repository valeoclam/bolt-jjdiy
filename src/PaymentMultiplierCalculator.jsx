import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function PaymentMultiplierCalculator({ onLogout }) {
  const [records, setRecords] = useState([]);
  const [betAmount, setBetAmount] = useState('');
  const [prizeAmount, setPrizeAmount] = useState('');
  const navigate = useNavigate();
  const [activeInput, setActiveInput] = useState(null);
  const [showKeyboard, setShowKeyboard] = useState(false);
  const keyboardRef = useRef(null);
  const inputRef = useRef(null);
  const [keyboardPosition, setKeyboardPosition] = useState({ top: 0, left: 0 });
  const keyboardOffset = 5;
  const betInputRef = useRef(null);
  const prizeInputRef = useRef(null);

  const handleAddRecord = () => {
    if (betAmount && prizeAmount) {
      setRecords([...records, { betAmount: parseFloat(betAmount), prizeAmount: parseFloat(prizeAmount) }]);
      setBetAmount('');
      setPrizeAmount('');
    }
  };

  const calculateAverageMultiplier = () => {
    if (records.length === 0) return 0;
    let validRecords = records.filter(record => record.betAmount > 0);
    if (validRecords.length === 0) return 0;
    const totalMultiplier = validRecords.reduce((sum, record) => sum + (record.prizeAmount / record.betAmount), 0);
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
    }
  };

  const handleBackspaceClick = () => {
    if (activeInput === 'betAmount') {
      setBetAmount(prev => prev.slice(0, -1));
    } else if (activeInput === 'prizeAmount') {
      setPrizeAmount(prev => prev.slice(0, -1));
    }
  };

  const handleClearClick = () => {
    if (activeInput === 'betAmount') {
      setBetAmount('');
    } else if (activeInput === 'prizeAmount') {
      setPrizeAmount('');
    }
  };

  const handleDecimalClick = () => {
    console.log('handleDecimalClick - activeInput:', activeInput, 'betAmount:', betAmount, 'prizeAmount:', prizeAmount);
    if (activeInput === 'betAmount') {
      if (betAmount && !betAmount.includes('.')) {
        setBetAmount(prev => prev + '.');
      }
    } else if (activeInput === 'prizeAmount') {
      if (prizeAmount && !prizeAmount.includes('.')) {
        setPrizeAmount(prev => prev + '.');
      }
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

  useEffect(() => {
    console.log('useEffect - betAmount changed:', betAmount, 'betInputRef.current:', betInputRef.current);
    if (betInputRef.current) {
      betInputRef.current.value = String(betAmount);
    }
  }, [betAmount]);

  useEffect(() => {
    console.log('useEffect - prizeAmount changed:', prizeAmount, 'prizeInputRef.current:', prizeInputRef.current);
    if (prizeInputRef.current) {
      prizeInputRef.current.value = String(prizeAmount);
    }
  }, [prizeAmount]);

  return (
    <div className="container">
      <h2>打虎日记 - 支付倍数计算器</h2>
      <button type="button" onClick={onLogout} className="logout-button">退出</button>
      <button type="button" onClick={handleBackToAdmin} style={{ marginTop: '10px', backgroundColor: '#6c757d' }}>返回后台管理</button>
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
      <div className="inspiration-list">
        <h3>记录列表</h3>
        {records.map((record, index) => (
          <div key={index} className="inspiration-item">
            <p>
              <strong>下注金额:</strong> {record.betAmount}
            </p>
            <p>
              <strong>中奖金额:</strong> {record.prizeAmount}
            </p>
          </div>
        ))}
      </div>
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
