import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fhcsffagxchzpxouuiuq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZoY3NmZmFneGNoenB4b3V1aXVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzYyMTQzMzAsImV4cCI6MjA1MTc5MDMzMH0.1DMl870gjGRq5LRlQMES9WpYWehiKiPIea2Yj1q4Pz8';
const supabase = createClient(supabaseUrl, supabaseKey);

function LazyDiaryPage({ loggedInUser, onLogout }) {
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [records, setRecords] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const navigate = useNavigate();
  const recognitionRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [currentRecord, setCurrentRecord] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [questionIndex, setQuestionIndex] = useState(0);

  useEffect(() => {
    if (loggedInUser) {
      setLoading(true);
      fetchQuestions();
      fetchTodayRecord();
    }
  }, [loggedInUser]);

  const fetchQuestions = async () => {
    try {
      const { data, error } = await supabase
        .from('lazy_diary_questions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('获取问题列表时发生错误:', error);
      } else {
        setQuestions(data);
        if (data && data.length > 0) {
          setCurrentQuestion(data[0].question);
        }
      }
    } catch (error) {
      console.error('发生意外错误:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTodayRecord = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('lazy_diary_records')
        .select('*')
        .eq('user_id', loggedInUser.id)
        .gte('created_at', `${today}T00:00:00.000Z`)
        .lt('created_at', `${today}T23:59:59.999Z`)
        .single();

      if (error) {
        console.error('获取今日懒人日记记录时发生错误:', error);
        setCurrentRecord(null);
      } else {
        setCurrentRecord(data);
        if (data && data.answers) {
          setQuestionIndex(data.answers.length);
        }
      }
    } catch (error) {
      console.error('发生意外错误:', error);
      setCurrentRecord(null);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (e) => {
    setAnswer(e.target.value);
  };

  const handleSaveAndNext = async () => {
    if (currentQuestion && answer) {
      try {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('username', loggedInUser.username)
          .single();

        if (userError) {
          console.error('获取用户ID时发生错误:', userError);
          return;
        }

        if (!userData) {
          console.error('未找到用户');
          return;
        }

        const newAnswer = {
          question: currentQuestion,
          answer: answer,
        };

        let updatedAnswers = currentRecord ? [...currentRecord.answers, newAnswer] : [newAnswer];

        if (currentRecord) {
          const { data, error } = await supabase
            .from('lazy_diary_records')
            .update({ answers: updatedAnswers, updated_at: new Date().toISOString() })
            .eq('id', currentRecord.id);

          if (error) {
            console.error('更新懒人日记记录时发生错误:', error);
          } else {
            console.log('懒人日记记录更新成功:', data);
            setCurrentRecord(prevRecord => ({ ...prevRecord, answers: updatedAnswers, updated_at: new Date().toISOString() }));
          }
        } else {
          const newRecord = {
            user_id: userData.id,
            answers: updatedAnswers,
          };

          const { data, error } = await supabase
            .from('lazy_diary_records')
            .insert([newRecord]);

          if (error) {
            console.error('添加懒人日记记录时发生错误:', error);
          } else {
            console.log('懒人日记记录添加成功:', data);
            setCurrentRecord({ ...newRecord, id: data[0].id, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
          }
        }
      } catch (error) {
        console.error('发生意外错误:', error);
      }
    }
    setAnswer('');
    if (questions && questions.length > 0) {
      setQuestionIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % questions.length;
        setCurrentQuestion(questions[nextIndex].question);
        return nextIndex;
      });
    }
  };

  const handleStartRecording = () => {
    setIsRecording(true);
    if (!recognitionRef.current) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        alert('您的浏览器不支持语音识别，请尝试其他浏览器。');
        setIsRecording(false);
        return;
      }
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.lang = 'zh-CN';
      recognitionRef.current.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map((result) => result[0].transcript)
          .join('');
        setAnswer(transcript);
        setIsRecording(false);
      };
      recognitionRef.current.onerror = (event) => {
        console.error('语音识别错误:', event.error);
        setIsRecording(false);
      };
    }
    recognitionRef.current.start();
  };

  const handleStopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
      handleSaveAndNext();
    }
  };

  const handleBackToModules = () => {
    navigate('/modules');
  };

  const handleEditQuestionsClick = () => {
    navigate('/edit-questions');
  };

  return (
    <div className="container">
      <h2>懒人日记</h2>
      {loggedInUser && <p>当前用户: {loggedInUser.username}</p>}
      <button type="button" onClick={onLogout} className="logout-button">退出</button>
      <div className="form-group">
        <p><strong>问题:</strong> {currentQuestion}</p>
        <textarea
          value={answer}
          onChange={handleAnswerChange}
          placeholder="请在此输入你的答案"
          style={{ height: '100px' }}
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
        <button type="button" onClick={handleStartRecording} disabled={isRecording} style={{ backgroundColor: '#28a745' }}>
          {isRecording ? '正在录音...' : '开始录音'}
        </button>
        <button type="button" onClick={handleStopRecording} disabled={!isRecording} style={{ backgroundColor: '#dc3545' }}>
          停止录音
        </button>
      </div>
      <button type="button" onClick={handleSaveAndNext} disabled={loading} style={{ marginTop: '10px', backgroundColor: '#007bff' }}>
        {loading ? '正在保存...' : '保存并进入下一个问题'}
      </button>
      <div className="inspiration-list">
        <h3>历史记录</h3>
        {currentRecord && currentRecord.answers && currentRecord.answers.map((record, index) => (
          <div key={index} className="inspiration-item">
            <p><strong>问题:</strong> {record.question}</p>
            <p><strong>回答:</strong> {record.answer}</p>
          </div>
        ))}
      </div>
      <button type="button" onClick={handleBackToModules} style={{ marginTop: '10px', backgroundColor: '#6c757d' }}>返回神奇百宝箱</button>
    </div>
  );
}

export default LazyDiaryPage;
