import React, { useState, useEffect, useRef } from 'react';
    import { useNavigate } from 'react-router-dom';
    import { createClient } from '@supabase/supabase-js';

    const supabaseUrl = 'https://fhcsffagxchzpxouuiuq.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZoY3NmZmFneGNoenB4b3V1aXVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzYyMTQzMzAsImV4cCI6MjA1MTc5MDMzMH0.1DMl870gjGRq5LRlQMES9WpYWehiKiPIea2Yj1q4Pz8';
    const supabase = createClient(supabaseUrl, supabaseKey);

    const questions = [
      "今天你有什么开心的事吗？",
      "今天你有什么不开心的事情吗？",
      "你今天学到了什么新知识？",
      "你今天做了什么让你感到自豪的事情？",
      "你今天有什么遗憾的事情吗？",
      "你今天对谁表达了感谢？",
      "你今天帮助了谁？",
      "你今天有什么新的想法吗？",
      "你今天有什么新的发现吗？",
      "你今天有什么新的感悟吗？",
      "你今天有什么新的计划吗？",
      "你今天有什么新的目标吗？",
      "你今天有什么新的挑战吗？",
      "你今天有什么新的突破吗？",
      "你今天有什么新的收获吗？",
      "你今天有什么新的体验吗？",
      "你今天有什么新的感受吗？",
      "你今天有什么新的认识吗？",
      "你今天有什么新的理解吗？",
      "你今天有什么新的启发吗？",
      "你今天有什么新的灵感吗？",
      "你今天有什么新的顿悟吗？",
      "你今天有什么新的领悟吗？",
      "你今天有什么新的启示吗？",
      "你今天有什么新的感触吗？",
      "你今天有什么新的体会吗？",
      "你今天有什么新的见解吗？",
      "你今天有什么新的看法吗？",
      "你今天有什么新的观点吗？",
      "你今天有什么新的角度吗？",
      "你今天有什么新的层面吗？",
      "你今天有什么新的维度吗？",
      "你今天有什么新的层面吗？",
      "你今天有什么新的维度吗？",
      "你今天有什么新的视角吗？",
      "你今天有什么新的观点吗？",
      "你今天有什么新的看法吗？",
      "你今天有什么新的见解吗？",
      "你今天有什么新的体会吗？",
      "你今天有什么新的感触吗？",
      "你今天有什么新的启示吗？",
      "你今天有什么新的领悟吗？",
      "你今天有什么新的顿悟吗？",
      "你今天有什么新的灵感吗？",
      "你今天有什么新的启发吗？",
      "你今天有什么新的理解吗？",
      "你今天有什么新的认识吗？",
      "你今天有什么新的感受吗？",
      "你今天有什么新的体验吗？",
      "你今天有什么新的收获吗？",
      "你今天有什么新的突破吗？",
      "你今天有什么新的挑战吗？",
      "你今天有什么新的目标吗？",
      "你今天有什么新的计划吗？",
      "你今天有什么新的感悟吗？",
      "你今天有什么新的发现吗？",
      "你今天有什么新的想法吗？",
      "你今天帮助了谁？",
      "你今天对谁表达了感谢？",
      "你今天有什么遗憾的事情吗？",
      "你今天做了什么让你感到自豪的事情？",
      "你今天学到了什么新知识？",
      "今天你有什么不开心的事情吗？",
      "今天你有什么开心的事吗？",
    ];

    function LazyDiaryPage({ loggedInUser, onLogout }) {
      const [currentQuestion, setCurrentQuestion] = useState('');
      const [answer, setAnswer] = useState('');
      const [records, setRecords] = useState([]);
      const [isRecording, setIsRecording] = useState(false);
      const navigate = useNavigate();
      const recognitionRef = useRef(null);
      const [loading, setLoading] = useState(false);

      useEffect(() => {
        if (loggedInUser) {
          setLoading(true);
          fetchRecords();
          pickRandomQuestion();
        }
      }, [loggedInUser]);

      const fetchRecords = async () => {
        try {
          const { data, error } = await supabase
            .from('lazy_diary_records')
            .select('*')
            .eq('user_id', loggedInUser.id)
            .order('created_at', { ascending: false });

          if (error) {
            console.error('获取懒人日记记录时发生错误:', error);
          } else {
            setRecords(data);
          }
        } catch (error) {
          console.error('发生意外错误:', error);
        } finally {
          setLoading(false);
        }
      };

      const pickRandomQuestion = () => {
        const randomIndex = Math.floor(Math.random() * questions.length);
        setCurrentQuestion(questions[randomIndex]);
      };

      const handleAnswerChange = (e) => {
        setAnswer(e.target.value);
      };

      const handleEndQuestion = async () => {
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

            const newRecord = {
              user_id: userData.id,
              question: currentQuestion,
              answer: answer,
            };

            const { data, error } = await supabase
              .from('lazy_diary_records')
              .insert([newRecord]);

            if (error) {
              console.error('添加懒人日记记录时发生错误:', error);
            } else {
              console.log('懒人日记记录添加成功:', data);
              setRecords((prevRecords) => [...prevRecords, { ...newRecord, id: data[0].id, created_at: new Date().toISOString() }]);
            }
          } catch (error) {
            console.error('发生意外错误:', error);
          }
        }
        setAnswer('');
        pickRandomQuestion();
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
          handleEndQuestion();
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
          {loggedInUser && loggedInUser.role === 'admin' && (
            <button type="button" onClick={handleEditQuestionsClick} style={{ marginTop: '20px', backgroundColor: '#007bff' }}>编辑问题库</button>
          )}
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
          <button type="button" onClick={handleEndQuestion} disabled={loading} style={{ display: 'none' }}>
            {loading ? '正在保存...' : '结束提问'}
          </button>
          <div className="inspiration-list">
            <h3>历史记录</h3>
            {records.map((record, index) => (
              <div key={record.id || index} className="inspiration-item">
                <p><strong>问题:</strong> {record.question}</p>
                <p><strong>回答:</strong> {record.answer}</p>
                <p><strong>时间:</strong> {record.created_at ? new Date(record.created_at).toLocaleString() : new Date().toLocaleString()}</p>
              </div>
            ))}
          </div>
          <button type="button" onClick={handleBackToModules} style={{ marginTop: '10px', backgroundColor: '#6c757d' }}>返回神奇百宝箱</button>
        </div>
      );
    }

    export default LazyDiaryPage;
