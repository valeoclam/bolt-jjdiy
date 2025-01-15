import React, { useState, useEffect, useRef } from 'react';
    import { useNavigate } from 'react-router-dom';
    import { createClient } from '@supabase/supabase-js';

    const supabaseUrl = 'https://fhcsffagxchzpxouuiuq.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZoY3NmZmFneGNoenB4b3V1aXVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzYyMTQzMzAsImV4cCI6MjA1MTc5MDMzMH0.1DMl870gjGRq5LRlQMES9WpYWehiKiPIea2Yj1q4Pz8';
    const supabase = createClient(supabaseUrl, supabaseKey);

    function TestNavigationPage({ loggedInUser, onLogout }) {
      const [questions, setQuestions] = useState([]);
      const [visitedQuestions, setVisitedQuestions] = useState([]);
      const [currentQuestion, setCurrentQuestion] = useState('');
      const navigate = useNavigate();
      const [loading, setLoading] = useState(false);
      const [answeredFixedQuestion, setAnsweredFixedQuestion] = useState(false);
      const [disableSkip, setDisableSkip] = useState(false);
      const [previousQuestions, setPreviousQuestions] = useState([]);
      const [initialQuestionLoaded, setInitialQuestionLoaded] = useState(false);
      const [currentQuestionType, setCurrentQuestionType] = useState('text');
      const visitedQuestionsRef = useRef([]);
      const questionIndexRef = useRef(0);
      const [isRecording, setIsRecording] = useState(false);
      const [audioBlob, setAudioBlob] = useState(null);
      const [mediaRecorder, setMediaRecorder] = useState(null);
      const [audioUrl, setAudioUrl] = useState(null);
      const [recordButtonText, setRecordButtonText] = useState('开始录音');
      const [recordingError, setRecordingError] = useState('');
      const [attemptedMimeType, setAttemptedMimeType] = useState('');
      const [supportedMimeTypes, setSupportedMimeTypes] = useState([]);

      useEffect(() => {
        if (loggedInUser) {
          setLoading(true);
          fetchQuestions();
          detectSupportedMimeTypes();
        }
      }, [loggedInUser]);

      useEffect(() => {
        if (questions && questions.length > 0) {
            if (!initialQuestionLoaded) {
                const fixedQuestion = questions.find(question => question.is_fixed);
                let initialIndex = 0;
                if (fixedQuestion) {
                    initialIndex = questions.findIndex(q => q.id === fixedQuestion?.id);
                    setCurrentQuestion(fixedQuestion.question);
                    setCurrentQuestionType(fixedQuestion.type);
                } else {
                    setCurrentQuestion(questions[0].question);
                    setCurrentQuestionType(questions[0].type);
                    initialIndex = 0;
                }
                visitedQuestionsRef.current = [initialIndex];
                setVisitedQuestions([initialIndex]);
                questionIndexRef.current = initialIndex;
                setInitialQuestionLoaded(true);
            }
        }
      }, [questions, initialQuestionLoaded]);

      useEffect(() => {
        setDisableSkip(false);
      }, [visitedQuestionsRef.current]);

      useEffect(() => {
        setVisitedQuestions([...new Set(visitedQuestionsRef.current)]);
      }, [visitedQuestionsRef.current]);

      const fetchQuestions = async () => {
        try {
          const { data, error } = await supabase
            .from('lazy_diary_questions')
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: false });

          if (error) {
            console.error('获取问题列表时发生错误:', error);
          } else {
            console.log('Fetched questions:', data);
            setQuestions(data);
          }
        } catch (error) {
          console.error('发生意外错误:', error);
        } finally {
          setLoading(false);
        }
      };

      const detectSupportedMimeTypes = () => {
        const mimeTypes = [
          'audio/webm;codecs=opus',
          'audio/webm',
          'audio/mp4',
          'audio/mpeg',
          'audio/ogg',
        ];
        const supported = mimeTypes.filter(mimeType => MediaRecorder.isTypeSupported(mimeType));
        setSupportedMimeTypes(supported);
      };

      const handleSkipQuestion = () => {
        if (disableSkip) {
            return;
        }
        if (questions && questions.length > 0) {
            setPreviousQuestions(prev => [...prev, currentQuestion]);
            let nextIndex;
            const fixedQuestion = questions.find(question => question.is_fixed);
            if (fixedQuestion && !answeredFixedQuestion) {
                setAnsweredFixedQuestion(true);
                const nextQuestion = questions.find((question, index) => index === (questionIndexRef.current + 1) % questions.length && !question.is_fixed);
                if (nextQuestion) {
                    nextIndex = questions.findIndex(q => q.id === nextQuestion?.id);
                    setCurrentQuestion(nextQuestion.question);
                    setCurrentQuestionType(nextQuestion.type);
                    visitedQuestionsRef.current = [...visitedQuestionsRef.current, nextIndex];
                    setVisitedQuestions(() => [...new Set(visitedQuestionsRef.current)]);
                    console.log('Skip - next question:', nextQuestion.question, 'index:', nextIndex);
                } else {
                    const firstNonFixed = questions.find(question => !question.is_fixed);
                    if (firstNonFixed) {
                        nextIndex = questions.findIndex(q => q.id === firstNonFixed?.id);
                        setCurrentQuestion(firstNonFixed.question);
                        setCurrentQuestionType(firstNonFixed.type);
                        visitedQuestionsRef.current = [...visitedQuestionsRef.current, nextIndex];
                        setVisitedQuestions(() => [...new Set(visitedQuestionsRef.current)]);
                        console.log('Skip - first non-fixed question:', firstNonFixed.question, 'index:', nextIndex);
                    } else {
                        setCurrentQuestion('');
                        setCurrentQuestionType('text');
                        nextIndex = 0;
                    }
                }
            } else {
                nextIndex = (questionIndexRef.current + 1) % questions.length;
                setCurrentQuestion(questions[nextIndex].question);
                setCurrentQuestionType(questions[nextIndex].type);
                visitedQuestionsRef.current = [...visitedQuestionsRef.current, nextIndex];
                setVisitedQuestions(() => [...new Set(visitedQuestionsRef.current)]);
                console.log('Skip - next question:', questions[nextIndex].question, 'index:', nextIndex);
            }
            questionIndexRef.current = nextIndex;
        }
    };

    const handleStartRecording = async () => {
        setIsRecording(true);
        setAudioBlob(null);
        setAudioUrl(null);
        setRecordButtonText('停止录音');
        let recorder;
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            let mimeTypeToUse = 'audio/webm;codecs=opus';
            if (!MediaRecorder.isTypeSupported(mimeTypeToUse)) {
                console.warn('audio/webm;codecs=opus not supported, trying audio/webm');
                mimeTypeToUse = 'audio/webm';
                if (!MediaRecorder.isTypeSupported(mimeTypeToUse)) {
                     console.warn('audio/webm not supported either');
                    setAttemptedMimeType('not supported');
                    setRecordingError('audio/webm and audio/webm;codecs=opus are not supported');
                    setIsRecording(false);
                    setRecordButtonText('开始录音');
                    return;
                }
            }
            setAttemptedMimeType(mimeTypeToUse);
            recorder = new MediaRecorder(stream, { mimeType: mimeTypeToUse });
            setMediaRecorder(recorder);
            recorder.start();

            const chunks = [];
            recorder.ondataavailable = (event) => {
                chunks.push(event.data);
            };

            recorder.onstop = () => {
                const blob = new Blob(chunks, { type: 'audio/webm' });
                setAudioBlob(blob);
                setAudioUrl(URL.createObjectURL(blob));
                stream.getTracks().forEach(track => track.stop());
                setRecordButtonText('开始录音');
                setRecordingError('');
            };
        } catch (error) {
            console.error('录音启动失败:', error);
            setIsRecording(false);
            setRecordButtonText('开始录音');
            setAttemptedMimeType(attemptedMimeType);
            setRecordingError(`录音启动失败: ${error.message} (mimeType: ${attemptedMimeType})`);
            console.error('Error object:', error);
        }
    };

    const handleStopRecording = () => {
        if (mediaRecorder) {
            mediaRecorder.stop();
            setIsRecording(false);
            setRecordButtonText('开始录音');
        }
    };

      const handleBackToModules = () => {
        navigate('/modules');
      };

      return (
        <div className="container">
          <h2>测试页面</h2>
          {loggedInUser && <p>当前用户: {loggedInUser.username}</p>}
          <button type="button" onClick={onLogout} className="logout-button">退出</button>
          <button type="button" onClick={handleBackToModules} style={{ marginTop: '10px', backgroundColor: '#6c757d' }}>返回神奇百宝箱</button>
          {loading ? <p>加载中...</p> : (
            <>
              <p>当前问题: {currentQuestion}</p>
              <button type="button" onClick={handleSkipQuestion} disabled={disableSkip}>跳过</button>
              <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '10px', gap: '10px' }}>
                    <button
                        type="button"
                        onClick={isRecording ? handleStopRecording : handleStartRecording}
                        disabled={false}
                        style={{ backgroundColor: isRecording ? '#dc3545' : '#28a745' }}
                    >
                        {recordButtonText}
                    </button>
                     {isRecording && (
                        <button
                            type="button"
                            onClick={handleStopRecording}
                            style={{ backgroundColor: '#dc3545' }}
                        >
                            停止录音
                        </button>
                    )}
                </div>
                {audioUrl && <audio src={audioUrl} controls />}
                 {recordingError && <p className="error-message">{recordingError}</p>}
                 <div>
                    <h3>Supported Mime Types:</h3>
                    <ul>
                        {supportedMimeTypes.map(mimeType => (
                            <li key={mimeType}>{mimeType}</li>
                        ))}
                    </ul>
                </div>
            </>
          )}
        </div>
      );
    }

    export default TestNavigationPage;
