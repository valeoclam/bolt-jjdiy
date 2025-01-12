import React, { useState, useEffect, useRef } from 'react';
    import { useNavigate } from 'react-router-dom';
    import { createClient } from '@supabase/supabase-js';

    const supabaseUrl = 'https://fhcsffagxchzpxouuiuq.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZoY3NmZmFneGNoenB4b3V1aXVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzYyMTQzMzAsImV4cCI6MjA1MTc5MDMzMH0.1DMl870gjGRq5LRlQMES9WpYWehiKiPIea2Yj1q4Pz8';
    const supabase = createClient(supabaseUrl, supabaseKey);

    function LazyDiaryHistoryPage({ loggedInUser, onLogout }) {
      const [groupedRecords, setGroupedRecords] = useState([]);
      const [loading, setLoading] = useState(false);
      const navigate = useNavigate();
      const [startDate, setStartDate] = useState('');
      const [endDate, setEndDate] = useState('');
      const containerRef = useRef(null);
      const [errorMessage, setErrorMessage] = useState('');
      const [searchKeyword, setSearchKeyword] = useState('');

      useEffect(() => {
        if (loggedInUser) {
          setLoading(true);
          fetchRecords();
        }
      }, [loggedInUser, startDate, endDate, searchKeyword]);

      const fetchRecords = async () => {
        try {
          let query = supabase
            .from('lazy_diary_records')
            .select('*')
            .eq('user_id', loggedInUser.id)
            .order('created_at', { ascending: false });

          if (startDate) {
            query = query.gte('created_at', `${startDate}T00:00:00.000Z`);
          }
          if (endDate) {
            query = query.lt('created_at', `${endDate}T23:59:59.999Z`);
          }

          const { data, error } = await query;

          if (error) {
            console.error('获取懒人日记记录时发生错误:', error);
            setErrorMessage('获取懒人日记记录失败，请重试。');
          } else {
            if (data && data.length > 0) {
              const recordsWithAnswers = await Promise.all(data.map(async (record) => {
                const { data: answersData, error: answersError } = await supabase
                  .from('lazy_diary_answers')
                  .select('*')
                  .eq('record_id', record.id)
                  .order('created_at', { ascending: true });

                if (answersError) {
                  console.error('获取懒人日记答案时发生错误:', answersError);
                  return { ...record, answers: [] };
                } else {
                  return { ...record, answers: answersData };
                }
              }));
              groupRecordsByDate(recordsWithAnswers || []);
            } else {
              groupRecordsByDate([]);
            }
          }
        } catch (error) {
          console.error('发生意外错误:', error);
          setErrorMessage('发生意外错误，请重试。');
        } finally {
          setLoading(false);
        }
      };

      const groupRecordsByDate = (records) => {
        const filteredRecords = records.filter(record => {
          if (!searchKeyword) return true;
          return record.answers.some(answer =>
            answer.question.toLowerCase().includes(searchKeyword.toLowerCase()) ||
            answer.answer.toLowerCase().includes(searchKeyword.toLowerCase())
          );
        });

        const grouped = filteredRecords.reduce((acc, record) => {
          const date = new Date(record.created_at).toLocaleDateString();
          if (!acc[date]) {
            acc[date] = {
              date: date,
              records: [],
            };
          }
          acc[date].records.push(record);
          return acc;
        }, {});

        setGroupedRecords(Object.values(grouped));
      };

      const handleBackToModules = () => {
        navigate('/modules');
      };

      const handleBackToLazyDiary = () => {
        navigate('/lazy-diary');
      };

      return (
        <div className="container" ref={containerRef}>
          <h2>懒人日记 - 历史记录</h2>
          {loggedInUser && <p>当前用户: {loggedInUser.username}</p>}
          <button type="button" onClick={onLogout} className="logout-button">退出</button>
          <button type="button" onClick={handleBackToModules} style={{ marginTop: '10px', backgroundColor: '#6c757d' }}>返回神奇百宝箱</button>
          <button type="button" onClick={handleBackToLazyDiary} style={{ marginTop: '10px', backgroundColor: '#28a745' }}>返回懒人日记</button>
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
            <label htmlFor="searchKeyword">搜索关键字:</label>
            <input
              type="text"
              id="searchKeyword"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="输入关键字搜索"
            />
          </div>
          {errorMessage && <p className="error-message">{errorMessage}</p>}
          <div className="inspiration-list">
            <h3>历史记录</h3>
            {groupedRecords.map((groupedRecord) => (
              <div key={groupedRecord.date} className="inspiration-item">
                <h4>{groupedRecord.date}</h4>
                {groupedRecord.records.map((record) => (
                  <div key={record.id}>
                    {record.answers && record.answers.map((answer, index) => (
                      <div key={index}>
                        <p><strong>问题:</strong> {answer.question}</p>
                        <p><strong>回答:</strong> {answer.answer}</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                          {Array.isArray(answer.photos) &&
                            answer.photos.map((photo, index) => (
                              <img key={index} src={photo} alt={`Diary ${index + 1}`} style={{ maxWidth: '100%', maxHeight: '150px', display: 'block', objectFit: 'contain', marginRight: '5px', marginBottom: '5px' }} />
                            ))}
                        </div>
                        {answer.audio_path && (
                          <audio src={`${supabaseUrl}/storage/v1/object/public/${answer.audio_path}`} controls />
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      );
    }

    export default LazyDiaryHistoryPage;
