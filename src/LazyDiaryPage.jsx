// src/LazyDiaryPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import imageCompression from 'browser-image-compression';

const supabaseUrl = 'https://fhcsffagxchzpxouuiuq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZoY3NmZmFneGNoenB4b3V1aXVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzYyMTQzMzAsImV4cCI6MjA1MTc5MDMzMH0.1DMl870gjGRq5LRlQMES9WpYWehiKiPIea2Yj1q4Pz8';
const supabase = createClient(supabaseUrl, supabaseKey);

function LazyDiaryPage({ loggedInUser, onLogout }) {
    const [currentQuestion, setCurrentQuestion] = useState('');
    const [answer, setAnswer] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const navigate = useNavigate();
    const recognitionRef = useRef(null);
    const [loading, setLoading] = useState(false);
    const [currentRecord, setCurrentRecord] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [questionIndex, setQuestionIndex] = useState(0);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const successTimeoutRef = useRef(null);
    const fileInputRef = useRef(null);
    const [tempDiaryPhotos, setTempDiaryPhotos] = useState([]);
    const MAX_PHOTOS = 6;
    const [noRecordMessage, setNoRecordMessage] = useState('');
    const [recordingTime, setRecordingTime] = useState(0);
    const [recordingWarning, setRecordingWarning] = useState(false);
    const [audioBlob, setAudioBlob] = useState(null);
    const [mediaRecorder, setMediaRecorder] = useState(null);
    const [audioUrl, setAudioUrl] = useState(null);
    const timerRef = useRef(null);
    const [answeredFixedQuestion, setAnsweredFixedQuestion] = useState(false);
    const [isCustomInputMode, setIsCustomInputMode] = useState(true);
    const [customInput, setCustomInput] = useState('');
    const [audioObjectURLs, setAudioObjectURLs] = useState({});
    const [testAudioUrl, setTestAudioUrl] = useState(null); // 新增状态
    const [isVoiceInputActive, setIsVoiceInputActive] = useState(false);

    useEffect(() => {
        if (loggedInUser) {
            setLoading(true);
            fetchQuestions();
            fetchTodayRecord();
        }
    }, [loggedInUser]);

    useEffect(() => {
        if (questions.length > 0 && !isCustomInputMode) {
            const fixedQuestion = questions.find(question => question.is_fixed);
            if (fixedQuestion) {
                setCurrentQuestion(fixedQuestion.question);
            } else {
                setCurrentQuestion(questions[0].question);
            }
        }
    }, [questions, isCustomInputMode]);

    useEffect(() => {
        let intervalId;
        if (isRecording) {
            intervalId = setInterval(() => {
                setRecordingTime((prevTime) => prevTime + 1);
            }, 1000);
        } else {
            clearInterval(intervalId);
            setRecordingTime(0);
            setRecordingWarning(false);
        }
        return () => clearInterval(intervalId);
    }, [isRecording]);

    useEffect(() => {
        if (recordingTime >= 50 && recordingTime < 60) {
            setRecordingWarning(true);
        } else {
            setRecordingWarning(false);
        }
        if (recordingTime >= 60) {
            handleStopRecording();
        }
    }, [recordingTime]);

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
                .limit(1);

            if (error) {
                if (error.code !== '404') {
                    console.error('获取今日懒人日记记录时发生错误:', error, error.message);
                    setErrorMessage('获取今日懒人日记记录失败，请重试。');
                } else {
                    setNoRecordMessage('还没有今日的记录，请开始记录吧！');
                    setCurrentRecord(null);
                    setErrorMessage('');
                }
            } else {
                if (data && data[0]) {
                    const { data: answersData, error: answersError } = await supabase
                        .from('lazy_diary_answers')
                        .select('*')
                        .eq('record_id', data[0].id)
                        .order('created_at', { ascending: false });

                    if (answersError) {
                        console.error('获取今日懒人日记答案时发生错误:', answersError);
                        setCurrentRecord({ ...data[0], answers: [] });
                    } else {
                        setCurrentRecord({ ...data[0], answers: answersData });
                    }
                } else {
                    setCurrentRecord(null);
                }
                setNoRecordMessage('');
            }
        } catch (error) {
            console.error('发生意外错误:', error, error.message);
            setErrorMessage('发生意外错误，请重试。');
            setCurrentRecord(null);
            setNoRecordMessage('');
        } finally {
            setLoading(false);
        }
    };

    const handleAnswerChange = (e) => {
        setAnswer(e.target.value);
    };

    const handleCustomInputChange = (e) => {
        setCustomInput(e.target.value);
    };

    const handleSaveAndNext = async () => {
        if (isCustomInputMode && !customInput) {
            setErrorMessage('请先输入内容');
            return;
        }
        if (!isCustomInputMode && !answer) {
            setErrorMessage('请先输入答案');
            return;
        }
        setLoading(true);
        try {
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('id')
                .eq('username', loggedInUser.username)
                .single();

            if (userError) {
                console.error('获取用户ID时发生错误:', userError);
                setErrorMessage('获取用户ID失败，请重试。');
                return;
            }

            if (!userData) {
                console.error('未找到用户');
                setErrorMessage('未找到用户，请重试。');
                return;
            }

            let audioPath = null;

            if (audioBlob) {
                const fileName = `audio-${loggedInUser.id}-${new Date().getTime()}.webm`;
                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('lazy-diary-audio')
                    .upload(fileName, audioBlob, {
                        contentType: 'audio/webm',
                    });

                if (uploadError) {
                    console.error('上传录音文件失败:', uploadError, uploadError.message);
                    setErrorMessage('上传录音文件失败，请重试。' + uploadError.message);
                    return;
                }
                audioPath = uploadData.path;
            }

            const newAnswer = {
                record_id: currentRecord?.id,
                question: isCustomInputMode ? '自定义内容' : currentQuestion,
                answer: isCustomInputMode ? customInput : answer,
                photos: tempDiaryPhotos,
                audio_path: audioPath,
            };

            const { data, error } = await supabase
                .from('lazy_diary_answers')
                .insert([newAnswer]);

            if (error) {
                console.error('添加懒人日记记录时发生错误:', error);
                setErrorMessage('添加懒人日记记录失败，请重试。' + error.message);
            } else {
                console.log('懒人日记记录添加成功:', data);
                setSuccessMessage('懒人日记记录添加成功!');
                setTempDiaryPhotos([]);
                setAudioBlob(null);
                setAudioUrl(null);
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
                if (successTimeoutRef.current) {
                    clearTimeout(successTimeoutRef.current);
                }
                successTimeoutRef.current = setTimeout(() => setSuccessMessage(''), 3000);
                if (!currentRecord) {
                    const newRecord = {
                        user_id: userData.id,
                    };
                    const { data: recordData, error: recordError } = await supabase
                        .from('lazy_diary_records')
                        .insert([newRecord]);
                    if (recordError) {
                        console.error('添加懒人日记记录时发生错误:', recordError);
                        setErrorMessage('添加懒人日记记录失败，请重试。' + recordError.message);
                    } else {
                        setCurrentRecord({ ...newRecord, id: recordData[0].id, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
                    }
                }
            }
        } catch (error) {
            console.error('发生意外错误:', error);
            setErrorMessage('发生意外错误，请重试。' + error.message);
        } finally {
            setLoading(false);
        }
        setAnswer('');
        setCustomInput('');
        if (questions && questions.length > 0 && !isCustomInputMode) {
            setQuestionIndex((prevIndex) => {
                const nextIndex = (prevIndex + 1) % questions.length;
                const fixedQuestion = questions.find(question => question.is_fixed);
                if (fixedQuestion && answeredFixedQuestion) {
                    const nextQuestion = questions.find((question, index) => index === nextIndex && !question.is_fixed);
                    setCurrentQuestion(nextQuestion?.question || '');
                    return nextIndex;
                } else {
                    setCurrentQuestion(questions[nextIndex].question);
                    return nextIndex;
                }
            });
        }
        fetchTodayRecord();
    };

    const handleSkipQuestion = () => {
        setAnswer('');
        if (questions && questions.length > 0 && !isCustomInputMode) {
            setQuestionIndex((prevIndex) => {
                const nextIndex = (prevIndex + 1) % questions.length;
                const fixedQuestion = questions.find(question => question.is_fixed);
                if (fixedQuestion && answeredFixedQuestion) {
                    const nextQuestion = questions.find((question, index) => index === nextIndex && !question.is_fixed);
                    setCurrentQuestion(nextQuestion?.question || '');
                    return nextIndex;
                } else {
                    setCurrentQuestion(questions[nextIndex].question);
                    return nextIndex;
                }
            });
        }
    };

    const handleStartRecording = async () => {
        if (audioBlob) {
            if (!window.confirm('您确定要删除上次的录音并开始新的录音吗？')) {
                return;
            }
        }
        setIsRecording(true);
        setAudioBlob(null);
        setAudioUrl(null);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
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
            };
        } catch (error) {
            console.error('录音启动失败:', error);
            setErrorMessage('录音启动失败，请检查麦克风权限。');
            setIsRecording(false);
            if (error.name === 'NotAllowedError') {
                setErrorMessage('请允许麦克风权限，以便使用录音功能。');
            }
        }
    };

    const handleStopRecording = () => {
        if (mediaRecorder) {
            mediaRecorder.stop();
            setIsRecording(false);
        }
    };

    const handleVoiceInput = () => {
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
                if (isCustomInputMode) {
                    setCustomInput(prevInput => prevInput + transcript); // 追加文本
                } else {
                    setAnswer(prevAnswer => prevAnswer + transcript); // 追加文本
                }
            };
            recognitionRef.current.onerror = (event) => {
                console.error("语音识别错误:", event.error);
                setIsVoiceInputActive(false);
                setErrorMessage("语音输入失败，请检查麦克风权限或网络连接。");
            };
        }
        // 启动录音
        if (!isRecording) {
            handleStartRecording();
        }
        setIsVoiceInputActive(true);
        setTimeout(() => {
            recognitionRef.current.start();
        }, 100);
    };

    const handleStopVoiceInput = () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            setIsVoiceInputActive(false);
        }
    };

    const handleTestAudio = () => {
        if (audioBlob) {
            setTestAudioUrl(URL.createObjectURL(audioBlob));
        } else {
            setErrorMessage("请先录制音频");
        }
    };

    const handleBackToModules = () => {
        navigate('/modules');
    };

    const handleEditQuestionsClick = () => {
        navigate('/edit-questions');
    };

    const handleViewHistory = () => {
        navigate('/lazy-diary/history');
    };

    const handleDiaryPhotosChange = async (e) => {
        setErrorMessage('');
        const files = Array.from(e.target.files);
        if (!files || files.length === 0) return;
        if (tempDiaryPhotos.length + files.length > MAX_PHOTOS) {
            setErrorMessage(`最多只能添加 ${MAX_PHOTOS} 张照片。`);
            return;
        }

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
            setTempDiaryPhotos((prevPhotos) => [...prevPhotos, ...results]);
        } catch (error) {
            console.error('图片压缩失败:', error);
            setErrorMessage('图片压缩失败，请重试。');
        }
    };

    const handleRemoveDiaryPhoto = (indexToRemove) => {
        setTempDiaryPhotos((prevPhotos) =>
            prevPhotos.filter((_, index) => index !== indexToRemove),
        );
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
            if (currentRecord && currentRecord.answers) {
                const newAudioObjectURLs = {};
                for (const answer of currentRecord.answers) {
                    if (answer.audio_path) {
                        const url = await createAudioObjectURL(answer.audio_path);
                        if (url) {
                            newAudioObjectURLs[answer.audio_path] = url;
                        }
                    }
                }
                setAudioObjectURLs(newAudioObjectURLs);
            }
        };

        fetchAudioURLs();
        return () => {
            for (const url of Object.values(audioObjectURLs)) {
                URL.revokeObjectURL(url);
            }
        };
    }, [currentRecord]);

    const handleToggleCustomInputMode = () => {
        setIsCustomInputMode(!isCustomInputMode);
        setAnswer('');
        setCustomInput('');
    };

    return (
        <div className="container">
            <h2>懒人日记</h2>
            {loggedInUser && <p>当前用户: {loggedInUser.username}</p>}
            <button type="button" onClick={onLogout} className="logout-button">退出</button>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <button type="button" onClick={handleToggleCustomInputMode} style={{ marginTop: '10px', backgroundColor: '#6c757d' }}>
                    {isCustomInputMode ? '返回问题模式' : '自定义输入'}
                </button>
            </div>
            <div className="form-group">
                {!isCustomInputMode ? (
                    <>
                        {questions.length === 0 ? (
                            <p>问题库为空，请联系管理员添加问题</p>
                        ) : (
                            <>
                                <p><strong>问题:</strong> {currentQuestion}</p>
                                <textarea
                                    value={answer}
                                    onChange={handleAnswerChange}
                                    placeholder="请在此输入你的答案"
                                    style={{ height: '100px' }}
                                />
                            </>
                        )}
                    </>
                ) : (
                    <textarea
                        value={customInput}
                        onChange={handleCustomInputChange}
                        placeholder="请在此输入你想说的话"
                        style={{ height: '100px' }}
                    />
                )}
            </div>
            <div className="form-group">
                <div className="file-input-container">
                    <input
                        type="file"
                        id="diaryPhotos"
                        accept="image/*"
                        multiple
                        onChange={handleDiaryPhotosChange}
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                    />
                    <button type="button" onClick={() => fileInputRef.current.click()} className="select-file-button" style={{ backgroundColor: '#28a745' }}>选择照片</button>
                    {Array.isArray(tempDiaryPhotos) &&
                        tempDiaryPhotos.map((photo, index) => (
                            <div key={index} style={{ position: 'relative', display: 'inline-block', marginRight: '5px', marginBottom: '5px' }}>
                                <img src={photo} alt={`Diary ${index + 1}`} style={{ maxWidth: '100%', maxHeight: '150px', display: 'block', objectFit: 'contain' }} />
                                <button
                                    type="button"
                                    onClick={() => handleRemoveDiaryPhoto(index)}
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
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <button
                    type="button"
                    onClick={handleStartRecording}
                    disabled={isRecording || isVoiceInputActive}
                    style={{ backgroundColor: '#28a745' }}
                >
                    {isRecording ? '正在录音...' : '开始录音'}
                </button>
                <button
                    type="button"
                    onClick={handleStopRecording}
                    disabled={!isRecording}
                    style={{ backgroundColor: '#dc3545' }}
                >
                    停止录音
                </button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <button
                    type="button"
                    onClick={handleVoiceInput}
                    style={{ backgroundColor: '#007bff' }}
                    disabled={isVoiceInputActive}
                >
                    开始语音输入
                </button>
                {/* 停止语音输入按钮，实际使用中较少用到，因为语音输入会自动停止 */}
                <button
                    type="button"
                    onClick={handleStopVoiceInput}
                    style={{ backgroundColor: '#dc3545' }}
                    disabled={!isVoiceInputActive}
                >
                    停止语音输入
                </button>
            </div>
            {recordingWarning && <p className="error-message">录音即将结束，请尽快完成！</p>}
            {recordingTime > 0 && <p>录音时长: {recordingTime} 秒</p>}
            {audioUrl && <audio src={audioUrl} controls />}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <button type="button" onClick={handleSaveAndNext} disabled={loading} style={{ marginTop: '10px', backgroundColor: '#007bff' }}>
                    {loading ? '正在保存...' : '保存并进入下一个问题'}
                </button>
                {!isCustomInputMode && (
                    <button type="button" onClick={handleSkipQuestion} style={{ marginTop: '10px', backgroundColor: '#6c757d' }}>
                        跳过
                    </button>
                )}
            </div>
            {successMessage && <p className="success-message">{successMessage}</p>}
            {errorMessage && <p className="error-message">{errorMessage}</p>}
            {noRecordMessage && <p className="error-message">{noRecordMessage}</p>}
            <div className="inspiration-list">
                <h3>今日记录</h3>
                {currentRecord && currentRecord.answers && currentRecord.answers.length > 0 ? (
                    [...currentRecord.answers].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).map((record, index) => (
                        <div key={index} className="inspiration-item">
                            <p><strong>问题:</strong> {record.question}</p>
                            <p><strong>回答:</strong> {record.answer}</p>
                            <p><strong>时间:</strong> {new Date(record.created_at).toLocaleString()}</p>
                            <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                                {Array.isArray(record.photos) &&
                                    record.photos.map((photo, index) => (
                                        <img key={index} src={photo} alt={`Diary ${index + 1}`} style={{ maxWidth: '100%', maxHeight: '150px', display: 'block', objectFit: 'contain', marginRight: '5px', marginBottom: '5px' }} />
                                    ))}
                            </div>
                            {record.audio_path && (
                                <audio src={audioObjectURLs[record.audio_path] || ''} controls />
                            )}
                        </div>
                    ))
                ) : null}
            </div>
            <button type="button" onClick={handleViewHistory} style={{ marginTop: '10px', backgroundColor: '#28a745' }}>查看历史记录</button>
            <button type="button" onClick={handleBackToModules} style={{ marginTop: '10px', backgroundColor: '#6c757d' }}>返回神奇百宝箱</button>
            {audioBlob && (
                <button type="button" onClick={handleTestAudio} style={{ marginTop: '10px', backgroundColor: '#007bff' }}>
                    测试录音
                </button>
            )}
            {testAudioUrl && <audio src={testAudioUrl} controls />}
        </div>
    );
}

export default LazyDiaryPage;
