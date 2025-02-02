import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from './supabaseClient';

function LazyDiaryHistoryPage({ loggedInUser, onLogout, allowedModules }) {
  const [groupedRecords, setGroupedRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const containerRef = useRef(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [audioObjectURLs, setAudioObjectURLs] = useState({});
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [editingAnswerId, setEditingAnswerId] = useState(null);
  const [editedAnswer, setEditedAnswer] = useState('');

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
        .eq('user_id', loggedInUser.id);

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
          const recordsWithAnswers = await Promise.all(
            data.map(async (record) => {
              const { data: answersData, error: answersError } = await supabase
                .from('lazy_diary_answers')
                .select('*')
                .eq('record_id', record.id)
                .order('created_at', { ascending: false });

              if (answersError) {
                console.error('获取懒人日记答案时发生错误:', answersError);
                return { ...record, answers: [] };
              } else {
                return { ...record, answers: answersData };
              }
            }),
          );
          const sortedRecordsWithAnswers = [...recordsWithAnswers].sort((a, b) => {
            const latestA = a.answers && a.answers.length > 0 ? new Date(a.answers[0].created_at) : new Date(a.created_at);
            const latestB = b.answers && b.answers.length > 0 ? new Date(b.answers[0].created_at) : new Date(b.created_at);
            return latestB - latestA;
          });
          groupRecordsByDate(sortedRecordsWithAnswers || []);
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
    const filteredRecords = records.filter((record) => {
      if (!searchKeyword) return true;
      return record.answers.some((answer) =>
        answer.question.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        answer.answer.toLowerCase().includes(searchKeyword.toLowerCase()),
				(questions.find(q => q.id === answer.question_id)?.question?.toLowerCase().includes(searchKeyword.toLowerCase()))
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

  const createAudioObjectURL = async (audioPath) => {
    if (!audioPath) return null;
    try {
      const { data, error } = await supabase.storage
        .from('lazy-diary-audio')
        .download(audioPath);

      if (error) {
        console.error('下载录音文件失败:', error);
        return null;
      }
      const url = URL.createObjectURL(data);
      return url;
    } catch (error) {
      console.error('创建音频 URL 失败:', error);
      return null;
    }
  };

  useEffect(() => {
    const fetchAudioURLs = async () => {
      const newAudioObjectURLs = {};
      for (const group of groupedRecords) {
        for (const record of group.records) {
          if (record.answers) {
            for (const answer of record.answers) {
              if (answer.audio_path) {
                const url = await createAudioObjectURL(answer.audio_path);
                if (url) {
                  newAudioObjectURLs[answer.audio_path] = url;
                }
              }
            }
          }
        }
      }
      setAudioObjectURLs(newAudioObjectURLs);
    };

    fetchAudioURLs();
    return () => {
      for (const url of Object.values(audioObjectURLs)) {
        URL.revokeObjectURL(url);
      }
    };
  }, [groupedRecords]);

const handleDeleteAnswer = async (id) => {
  if (confirmDeleteId === id) {
    setLoading(true);
    try {
      // Get the audio_path before deleting the record
      const { data: answerData, error: answerError } = await supabase
        .from('lazy_diary_answers')
        .select('audio_path')
        .eq('id', id)
        .single();

      if (answerError) {
        console.error('获取懒人日记答案时发生错误:', answerError);
        setErrorMessage('获取懒人日记答案失败，请重试。');
        return;
      }

      const audioPath = answerData?.audio_path;

      // Delete the record from lazy_diary_answers
      const { data, error } = await supabase
        .from('lazy_diary_answers')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('删除懒人日记答案时发生错误:', error);
        setErrorMessage('删除懒人日记答案失败，请重试。');
      } else {
        console.log('懒人日记答案删除成功:', data);
        // Delete the audio file from Supabase Storage if audioPath exists
        if (audioPath) {
          try {
            const { error: storageError } = await supabase.storage
              .from('lazy-diary-audio')
              .remove([audioPath]);

            if (storageError) {
              console.error('删除录音文件时发生错误:', storageError);
              setErrorMessage('删除录音文件失败，请重试。');
            } else {
              console.log('录音文件删除成功:', audioPath);
            }
          } catch (storageError) {
            console.error('发生意外错误:', storageError);
            setErrorMessage('发生意外错误，请重试。');
          }
        }
        fetchRecords();
        setConfirmDeleteId(null);
      }
    } catch (error) {
      console.error('发生意外错误:', error);
      setErrorMessage('发生意外错误，请重试。');
    } finally {
      setLoading(false);
    }
  } else {
    setConfirmDeleteId(id);
  }
};


  const handleEditAnswer = (id, answer) => {
    setEditingAnswerId(id);
    setEditedAnswer(answer);
  };

  const handleUpdateAnswer = async (id) => {
    if (editedAnswer) {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('lazy_diary_answers')
          .update({ answer: editedAnswer })
          .eq('id', id);

        if (error) {
          console.error('更新懒人日记答案时发生错误:', error);
          setErrorMessage('更新懒人日记答案失败，请重试。');
        } else {
          console.log('懒人日记答案更新成功:', data);
          fetchRecords();
          setEditingAnswerId(null);
          setEditedAnswer('');
        }
      } catch (error) {
        console.error('发生意外错误:', error);
        setErrorMessage('发生意外错误，请重试。');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCancelEdit = () => {
    setEditingAnswerId(null);
    setEditedAnswer('');
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
      <h2>懒人日记 - 历史记录</h2>
      {loggedInUser && <p>当前用户: {loggedInUser.username}</p>}
      <button type="button" onClick={onLogout} className="logout-button">退出</button>
      {allowedModules && allowedModules.length !== 1 && (
        <button type="button" onClick={handleBackToModules} style={{ marginTop: '10px', backgroundColor: '#6c757d' }}>返回神奇百宝箱</button>
      )}
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
        {groupedRecords.length === 0 ? (
          <p>没有历史记录</p>
        ) : (
          groupedRecords.map((groupedRecord) => (
            <div key={groupedRecord.date} className="inspiration-item">
              <h4>{groupedRecord.date}</h4>
              {groupedRecord.records &&
                groupedRecord.records.map((record) => (
                  <div key={record.id}>
                    {record.answers &&
                      record.answers.map((answer, index) => (
                        <div key={index}>
                          <p>
                            <strong>问题:</strong> {answer.question}
                          </p>
                          {editingAnswerId === answer.id ? (
                            <>
                              <textarea
                                value={editedAnswer}
                                onChange={(e) => setEditedAnswer(e.target.value)}
                                style={{ height: '80px' }}
                              />
                              <div className="edit-buttons">
                                <button onClick={() => handleUpdateAnswer(answer.id)} disabled={loading}>
                                  {loading ? '正在保存...' : '更新'}
                                </button>
                                <button onClick={handleCancelEdit} style={{ backgroundColor: '#6c757d' }}>取消</button>
                              </div>
                            </>
                          ) : (
                            <>
                              <p>
                                <strong>回答:</strong> {
                                  // Check if the question type is single or multiple choice
                                  answer.selected_option
                                    ? // If selected_option exists, parse it as JSON if it's a string, otherwise use it directly
                                    typeof answer.selected_option === 'string'
                                      ? (() => {
                                          try {
                                            return JSON.parse(answer.selected_option).join(', ');
                                          } catch (e) {
                                            return answer.selected_option;
                                          }
                                        })()
                                      : Array.isArray(answer.selected_option) ? answer.selected_option.join(', ') : answer.selected_option
                                    : // If selected_option doesn't exist, use the regular answer
                                    answer.answer
                                }
                              </p>
                              <p>
                                <strong>时间:</strong> {new Date(answer.created_at).toLocaleString()}
                              </p>
                              <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                                {Array.isArray(answer.photos) &&
                                  answer.photos.map((photo, index) => (
                                    <img
                                      key={index}
                                      src={photo}
                                      alt={`Diary ${index + 1}`}
                                      style={{
                                        maxWidth: '100%',
                                        maxHeight: '150px',
                                        display: 'block',
                                        objectFit: 'contain',
                                        marginRight: '5px',
                                        marginBottom: '5px',
                                      }}
                                    />
                                  ))}
                              </div>
                             {answer.audio_path && (
      <audio src={audioObjectURLs[answer.audio_path] || ''} controls />
    )}
    <div className="edit-buttons">
      {/* Modified condition to always show edit button */}
      <button onClick={() => handleEditAnswer(answer.id, answer.answer)}>编辑</button>
      <button
        className="delete-button"
        onClick={() => handleDeleteAnswer(answer.id)}
      >
        {confirmDeleteId === answer.id ? '确认删除' : '删除'}
      </button>
    </div>
  </>
)}
                        </div>
                      ))}
                  </div>
                ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default LazyDiaryHistoryPage;
