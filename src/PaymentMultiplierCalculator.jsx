import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function PaymentMultiplierCalculator({ onLogout }) {
  const [records, setRecords] = useState([]);
  const [betAmount, setBetAmount] = useState('');
  const [prizeAmount, setPrizeAmount] = useState('');
  const navigate = useNavigate();

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

  return (
    <div className="container">
      <h2>打虎日记 - 支付倍数计算器</h2>
      <button type="button" onClick={onLogout} className="logout-button">退出</button>
      <button type="button" onClick={handleBackToAdmin} style={{ marginTop: '10px', backgroundColor: '#6c757d' }}>返回后台管理</button>
      <div className="form-group">
        <label htmlFor="betAmount">下注金额:</label>
        <input
          type="number"
          id="betAmount"
          value={betAmount}
          onChange={(e) => setBetAmount(e.target.value)}
        />
      </div>
      <div className="form-group">
        <label htmlFor="prizeAmount">中奖金额:</label>
        <input
          type="number"
          id="prizeAmount"
          value={prizeAmount}
          onChange={(e) => setPrizeAmount(e.target.value)}
        />
      </div>
      <button type="button" onClick={handleAddRecord} style={{ backgroundColor: '#28a745' }}>添加记录</button>
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
      <p>
        <strong>平均支付倍数:</strong> {calculateAverageMultiplier()}
      </p>
    </div>
  );
}

export default PaymentMultiplierCalculator;
