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
        const [testAudioUrl, setTestAudioUrl] = useState(null);
        const [isVoiceInputActive, setIsVoiceInputActive] = useState(false);
        const [voiceInputButtonText, setVoiceInputButtonText] = useState('开始语音输入');
        const [recordButtonText, setRecordButtonText] = useState('开始录音');
        const [tempAnswer, setTempAnswer] = useState('');
        const [tempCustomInput, setTempCustomInput] = useState('');
        const [tempAudioBlob, setTempAudioBlob] = useState(null);
        const [tempAudioUrl, setTempAudioUrl] = useState(null);
        const [tempPhotos, setTempPhotos] = useState([]);
        const [showConfirmModal, setShowConfirmModal] = useState(false);
        const [confirmAction, setConfirmAction] = useState('');
        const [disableSkip, setDisableSkip] = useState(false);
        const [visitedQuestions, setVisitedQuestions] = useState([]);
        const [disableCustomInput, setDisableCustomInput] = useState(false);
        const [customInputMessage, setCustomInputMessage] = useState('');
        const [problemInputMessage, setProblemInputMessage] = useState('');
        const errorMessageTimeoutRef = useRef(null);
        const [selectedOptions, setSelectedOptions] = useState([]);
        const [isOptionSelected, setIsOptionSelected] = useState(false);
        const [previousQuestions, setPreviousQuestions] = useState([]);
        const [currentQuestionType, setCurrentQuestionType] = useState('text');
        const [initialQuestionLoaded, setInitialQuestionLoaded] = useState(false);
        const [firstSkip, setFirstSkip] = useState(true);
        const visitedQuestionsRef = useRef([]);
        const questionIndexRef = useRef(0);

        useEffect(() => {
            if (loggedInUser) {
                setLoading(true);
                fetchQuestions();
                fetchTodayRecord();
            }
        }, [loggedInUser]);

        useEffect(() => {
            if (questions && questions.length > 0) {
                if (!isCustomInputMode && !initialQuestionLoaded) {
                    const fixedQuestion = questions.find(question => question.is_fixed);
                    if (fixedQuestion) {
                        setCurrentQuestion(fixedQuestion.question);
                        setCurrentQuestionType(fixedQuestion.type);
                         visitedQuestionsRef.current = [questions.findIndex(q => q.id === fixedQuestion?.id)];
                         setVisitedQuestions([questions.findIndex(q => q.id === fixedQuestion?.id)]);
                         questionIndexRef.current = questions.findIndex(q => q.id === fixedQuestion?.id);
                    } else {
                        setCurrentQuestion(questions[0].question);
                        setCurrentQuestionType(questions[0].type);
                         visitedQuestionsRef.current = [0];
                         setVisitedQuestions([0]);
                         questionIndexRef.current = 0;
                    }
                    setInitialQuestionLoaded(true);
                }
            }
        }, [questions, isCustomInputMode, initialQuestionLoaded]);

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

        useEffect(() => {
            if (!isCustomInputMode) {
                setDisableSkip(!!(answer || tempDiaryPhotos.length > 0 || audioBlob || selectedOptions.length > 0));
                setDisableCustomInput(!!(answer || tempDiaryPhotos.length > 0 || audioBlob || selectedOptions.length > 0));
            } else {
                setDisableCustomInput(!!(customInput || tempDiaryPhotos.length > 0 || audioBlob));
            }
            if (!isCustomInputMode) {
                // setDisablePrevious(!!(tempDiaryPhotos.length > 0 || audioBlob || selectedOptions.length > 0) || visitedQuestionsRef.current.length <= 1);
            }  else {
                // setDisablePrevious(!!(customInput || tempDiaryPhotos.length > 0 || audioBlob) || visitedQuestionsRef.current.length <= 1);
            }

        }, [isCustomInputMode, answer, tempDiaryPhotos, audioBlob, customInput, selectedOptions]);

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
                console.log('questions.length in finally:', questions.length);
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
    if (errorMessageTimeoutRef.current) {
      clearTimeout(errorMessageTimeoutRef.current);
    }
    errorMessageTimeoutRef.current = setTimeout(() => setErrorMessage(''), 3000);
    return;
  }
  if (!isCustomInputMode && !answer && selectedOptions.length === 0) {
    setErrorMessage('请先输入答案');
    if (errorMessageTimeoutRef.current) {
      clearTimeout(errorMessageTimeoutRef.current);
    }
    errorMessageTimeoutRef.current = setTimeout(() => setErrorMessage(''), 3000);
    return;
  }

  setLoading(true);
  let audioPath = null;

  // Check if recording is in progress and stop it
  if (isRecording) {
    await handleStopRecording();
  }

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

    if (audioBlob) {
      const fileName = `audio-${loggedInUser.id}-${new Date().getTime()}.mp4`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('lazy-diary-audio')
        .upload(fileName, audioBlob, {
          contentType: 'audio/mp4',
        });

      if (uploadError) {
        console.error('上传录音文件失败:', uploadError, uploadError.message);
        setErrorMessage('上传录音文件失败，请重试。' + uploadError.message);
        return;
      }
      audioPath = uploadData.path;
    }

    // Create a new record if currentRecord is null
    let recordId = currentRecord?.id;
    console.log("handleSaveAndNext - currentRecord:", currentRecord);
    if (!recordId) {
      const newRecord = {
        user_id: userData.id,
      };
      console.log("handleSaveAndNext - Creating new record:", newRecord);
      const { data: recordData, error: recordError } = await supabase
        .from('lazy_diary_records')
        .insert([newRecord])
        .select('id'); // Select the id of the newly created record

      if (recordError) {
        console.error('添加懒人日记记录时发生错误:', recordError);
        setErrorMessage('添加懒人日记记录失败，请重试。' + recordError.message);
        return;
      } else if (recordData && recordData.length > 0) {
        recordId = recordData[0].id;
        console.log("handleSaveAndNext - New record created, recordId:", recordId);
        setCurrentRecord({ ...newRecord, id: recordId, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
      } else {
        console.log("handleSaveAndNext - New record created, but no id returned");
        setCurrentRecord({...newRecord, created_at: new Date().toISOString(), updated_at: new Date().toISOString()});
        throw new Error("Failed to create new record or retrieve record ID.");
      }
    }

    const newAnswer = {
      record_id: recordId, // Use the recordId
      question: isCustomInputMode ? '自定义内容' : currentQuestion,
      answer: isCustomInputMode ? customInput : answer,
      photos: tempDiaryPhotos,
      audio_path: audioPath,
      selected_option: currentQuestionType === 'multiple' ? JSON.stringify(selectedOptions) : selectedOptions.join(''),
    };
    console.log("handleSaveAndNext - Inserting new answer:", newAnswer);

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
      setSelectedOptions([]);
      setIsOptionSelected(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
      }
      successTimeoutRef.current = setTimeout(() => setSuccessMessage(''), 3000);
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
      let nextIndex;
      let nextQuestion;
      const fixedQuestion = questions.find(question => question.is_fixed);
      if (fixedQuestion && !answeredFixedQuestion) {
        setAnsweredFixedQuestion(true);
        nextQuestion = questions.find((question, index) => index === (prevIndex + 1) % questions.length && !question.is_fixed);
        if (nextQuestion) {
          nextIndex = questions.findIndex(q => q.id === nextQuestion?.id);
          setCurrentQuestion(nextQuestion.question);
          setCurrentQuestionType(nextQuestion.type);
          console.log('Skip - next question:', nextQuestion.question, 'index:', nextIndex);
          return nextIndex
        } else {
          const firstNonFixed = questions.find(question => !question.is_fixed);
          if (firstNonFixed) {
            nextIndex = questions.findIndex(q => q.id === firstNonFixed?.id);
            setCurrentQuestion(firstNonFixed.question);
            setCurrentQuestionType(firstNonFixed.type);
            console.log('Skip - first non-fixed question:', firstNonFixed.question, 'index:', nextIndex);
            return nextIndex
          } else {
            setCurrentQuestion('');
            setCurrentQuestionType('text');
            console.log('Skip - no question');
            return 0;
          }
        }
      } else {
        nextIndex = (prevIndex + 1) % questions.length;
        nextQuestion = questions[nextIndex];
        console.log('Skip - next question:', nextQuestion.question, 'index:', nextIndex);
        setCurrentQuestion(nextQuestion.question);
        setCurrentQuestionType(nextQuestion.type);
        return nextIndex
      }
    });
  }
  fetchTodayRecord();
};




    const handleSkipQuestion = () => {
        if (disableSkip) {
            return;
        }
        setAnswer('');
        setSelectedOptions([]);
        setIsOptionSelected(false);
        setTempDiaryPhotos([]);
        setAudioBlob(null);
        setAudioUrl(null);
        if (questions && questions.length > 0 && !isCustomInputMode) {
            setPreviousQuestions(prev => [...prev, currentQuestion]);
             setQuestionIndex((prevIndex) => {
                let nextIndex = 0;
                let nextQuestion;
                const fixedQuestion = questions.find(question => question.is_fixed);
                 if (fixedQuestion && !answeredFixedQuestion) {
                    setAnsweredFixedQuestion(true);
                    nextQuestion = questions.find((question, index) => index === (prevIndex + 1) % questions.length && !question.is_fixed);
                    if (nextQuestion) {
                        nextIndex = questions.findIndex(q => q.id === nextQuestion?.id);
                        console.log('Skip - next question:', nextQuestion.question, 'index:', nextIndex);
                    } else {
                        const firstNonFixed = questions.find(question => !question.is_fixed);
                         if (firstNonFixed) {
                            nextIndex = questions.findIndex(q => q.id === firstNonFixed?.id);
                            console.log('Skip - first non-fixed question:', firstNonFixed.question, 'index:', nextIndex);
                         } else {
                            setCurrentQuestion('');
                            setCurrentQuestionType('text');
                            console.log('Skip - no question');
                            return 0;
                         }
                    }
                } else {
                    nextIndex = (prevIndex + 1) % questions.length;
                    nextQuestion = questions[nextIndex];
                     console.log('Skip - next question:', nextQuestion.question, 'index:', nextIndex);
                     setCurrentQuestion(nextQuestion.question);
                     setCurrentQuestionType(nextQuestion.type);
                     return nextIndex
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
  setRecordButtonText('停止录音');
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream, { mimeType: 'audio/mp4' });
    setMediaRecorder(recorder);
    recorder.start();

    const chunks = [];
    recorder.ondataavailable = (event) => {
      console.log("handleStartRecording - ondataavailable - event.data:", event.data);
      chunks.push(event.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'audio/mp4' });
      setAudioBlob(blob);
      setAudioUrl(URL.createObjectURL(blob));
      stream.getTracks().forEach(track => track.stop());
      setRecordButtonText('开始录音');
      setRecordingError('');
    };
    recorder.onerror = (event) => {
      console.error("MediaRecorder error:", event.error);
      setIsRecording(false);
      setRecordButtonText('开始录音');
      setAttemptedMimeType('audio/mp4');
      setRecordingError(`录音启动失败: ${event.error.message} (mimeType: audio/mp4)`);
      console.error('Error object:', event.error);
    };
    recorder.onpause = () => {
      console.log("MediaRecorder paused");
    };
  } catch (error) {
    console.error('录音启动失败:', error);
    setErrorMessage('录音启动失败，请检查麦克风权限。');
    setIsRecording(false);
    setRecordButtonText('开始录音');
    if (error.name === 'NotAllowedError') {
      setErrorMessage('请允许麦克风权限，以便使用录音功能。');
    }
  }
};

const handleStopRecording = () => {
  return new Promise((resolve) => {
    if (mediaRecorder) {
      console.log("handleStopRecording - mediaRecorder state:", mediaRecorder.state);
      mediaRecorder.onstop = () => {
        console.log("handleStopRecording - onstop - mediaRecorder.chunks:", mediaRecorder.chunks);
        const blob = new Blob(mediaRecorder.chunks, { type: 'audio/mp4' });
        console.log("handleStopRecording - onstop - blob:", blob);
        console.log("handleStopRecording - onstop - blob.size:", blob.size);
        console.log("handleStopRecording - onstop - blob.type:", blob.type);
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        setTempAudioBlob(blob);
        setTempAudioUrl(URL.createObjectURL(blob));
        mediaRecorder.chunks = []; // Clear chunks after creating blob
        resolve();
      };
      try {
        setTimeout(() => {
          mediaRecorder.stop();
          setIsRecording(false);
          setRecordButtonText('开始录音');
        }, 100); // Add a 100ms delay
      } catch (error) {
        console.error("handleStopRecording - mediaRecorder.stop() error:", error);
        setIsRecording(false);
        setRecordButtonText('开始录音');
        resolve();
      }
    } else {
      resolve();
    }
  });
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
                        setCustomInput(prevInput => prevInput + transcript);
                    } else {
                        setAnswer(prevAnswer => prevAnswer + transcript);
                    }
                };
                recognitionRef.current.onerror = (event) => {
                    console.error("语音识别错误:", event.error);
                    setIsVoiceInputActive(false);
                    setVoiceInputButtonText('开始语音输入');
                    setErrorMessage("语音输入失败，请检查麦克风权限或网络连接。");
                };
                recognitionRef.current.onend = () => {
                    setIsVoiceInputActive(false);
                    setVoiceInputButtonText('开始语音输入');
                };
            }
            if (!isRecording) {
               handleStartRecording();
            }
            setIsVoiceInputActive(true);
            setVoiceInputButtonText('停止语音输入');
            setTimeout(() => {
                recognitionRef.current.start();
            }, 100);
        };

        const handleStopVoiceInput = () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
                setIsVoiceInputActive(false);
                setVoiceInputButtonText('开始语音输入');
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
					 console.log("LazyDiaryPage - handleViewHistory clicked, navigating to:", '/lazy-diary/history');
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
            if ((isCustomInputMode && (answer || tempDiaryPhotos.length > 0 || audioBlob || selectedOptions.length > 0)) ||
                (!isCustomInputMode && (customInput || tempDiaryPhotos.length > 0 || audioBlob || selectedOptions.length > 0))) {
                setShowConfirmModal(true);
                setConfirmAction(isCustomInputMode ? 'switchToProblemMode' : 'switchToCustomMode');
            } else {
                toggleMode();
            }
        };

        const toggleMode = (save = false) => {
           if (isCustomInputMode) {
                if (save) {
                    setTempAnswer(answer);
                    setTempPhotos(tempDiaryPhotos);
                    setTempAudioBlob(audioBlob);
                    setTempAudioUrl(audioUrl);
                }
                setAnswer(tempAnswer);
                setTempDiaryPhotos(tempPhotos);
                setAudioBlob(tempAudioBlob);
                setAudioUrl(tempAudioUrl);
            } else {
                if (save) {
                    setTempCustomInput(customInput);
                }
                setCustomInput(tempCustomInput);
            }
            setIsCustomInputMode(!isCustomInputMode);
            setShowConfirmModal(false);
            setConfirmAction('');
            setCustomInputMessage('');
            setProblemInputMessage('');
            if (recognitionRef.current) {
                recognitionRef.current.stop();
                recognitionRef.current = null;
            }
        };

        const handleClearInput = () => {
            if (isRecording) {
                handleStopRecording();
            }
            setAnswer('');
            setCustomInput('');
            setTempDiaryPhotos([]);
            setAudioBlob(null);
            setAudioUrl(null);
            setSelectedOptions([]);
            setIsOptionSelected(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        };

        const handleOptionSelect = (option) => {
            if (currentQuestionType === 'multiple') {
                if (selectedOptions.includes(option)) {
                    setSelectedOptions(selectedOptions.filter(opt => opt !== option));
                } else {
                    setSelectedOptions([...selectedOptions, option]);
                }
            } else {
                setSelectedOptions([option]);
            }
            setIsOptionSelected(true);
        };

        return (
            <div className="container">
                <h2>懒人日记</h2>
                {loggedInUser && <p>当前用户: {loggedInUser.username}</p>}
                <button type="button" onClick={onLogout} className="logout-button">退出</button>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <button
                        type="button"
                        onClick={disableCustomInput ? null : handleToggleCustomInputMode}
                        style={{ marginTop: '10px', backgroundColor: !disableCustomInput ? '#007bff' : '#ddd', cursor: disableCustomInput ? 'not-allowed' : 'pointer' }}
                        onMouseEnter={() => setCustomInputMessage((!isCustomInputMode && (answer || tempDiaryPhotos.length > 0 || audioBlob || selectedOptions.length > 0)) ? '请先保存当前问题内容' : '')}
                        onMouseLeave={() => setCustomInputMessage('')}
                        disabled={disableCustomInput}
                    >
                        {isCustomInputMode ? '返回问题模式' : '我有话要说'}
                    </button>
                </div>
                {customInputMessage && <p className="error-message">{customInputMessage}</p>}
                <div className="form-group">
                    {!isCustomInputMode ? (
                        <>
                            {questions.length === 0 ? (
                                <p>问题库为空，请联系管理员添加问题</p>
                            ) : (
                                <>
                                    <p><strong>问题:</strong> {currentQuestion}</p>
                                    {questions.find(q => q.question === currentQuestion)?.type === 'single' ? (
                                        <div>
                                            {questions.find(q => q.question === currentQuestion)?.options?.map((option, index) => (
                                                <div key={index}>
                                                    <label>
                                                        <input
                                                            type="radio"
                                                            name="singleOption"
                                                            value={option}
                                                            checked={selectedOptions.includes(option)}
                                                            onChange={() => handleOptionSelect(option)}
                                                        />
                                                        <span style={{ color: option === '白色' ? 'black' : option === '黑色' ? 'white' : option, backgroundColor: option === '白色' ? 'white' : option === '黑色' ? 'black' : 'transparent', padding: '5px', borderRadius: '4px', display: 'inline-block' }}>{option}</span>
                                                    </label>
                                                </div>
                                            ))}
                                        </div>
                                    ) : questions.find(q => q.question === currentQuestion)?.type === 'multiple' ? (
                                        <div>
                                            {questions.find(q => q.question === currentQuestion)?.options?.map((option, index) => (
                                                <div key={index}>
                                                    <label>
                                                        <input
                                                            type="checkbox"
                                                            name="multipleOption"
                                                            value={option}
                                                            checked={selectedOptions.includes(option)}
                                                            onChange={() => handleOptionSelect(option)}
                                                        />
                                                        <span style={{ color: option === '白色' ? 'black' : option === '黑色' ? 'white' : option, backgroundColor: option === '白色' ? 'white' : option === '黑色' ? 'black' : 'transparent', padding: '5px', borderRadius: '4px', display: 'inline-block' }}>{option}</span>
                                                    </label>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <textarea
                                            value={answer}
                                            onChange={handleAnswerChange}
                                            placeholder="请在此输入你的答案"
                                            style={{ height: '100px' }}
                                        />
                                    )}
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
                {currentQuestionType === 'text' && !isCustomInputMode && questions.length > 0 && (
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
                    <button type="button" onClick={() => fileInputRef.current.click()} className="select-file-button" style={{ marginTop: '0px', backgroundColor: '#28a745' }}>选择照片</button>
                </div>
            </div>
                )}
                {currentQuestionType === 'text' && !isCustomInputMode && questions.length > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '10px', gap: '10px' }}>
                        <button
                            type="button"
                            onClick={handleVoiceInput}
                            style={{ backgroundColor: isVoiceInputActive ? '#dc3545' : '#007bff' }}
                            disabled={questions.length === 0}
                        >
                            {voiceInputButtonText}
                        </button>
                         <button
                            type="button"
                            onClick={isRecording ? handleStopRecording : handleStartRecording}
                            disabled={isVoiceInputActive || questions.length === 0}
                            style={{ backgroundColor: isRecording ? '#dc3545' : '#28a745' }}
                        >
                            {recordButtonText}
                        </button>
                    </div>
                )}
                {isCustomInputMode && (
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
                    )}
                    {isCustomInputMode && (
                        <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '10px', gap: '10px' }}>
                            <button
                                type="button"
                                onClick={handleVoiceInput}
                                style={{ backgroundColor: isVoiceInputActive ? '#dc3545' : '#007bff' }}
                                disabled={false}
                            >
                                {voiceInputButtonText}
                            </button>
                             <button
                                type="button"
                                onClick={isRecording ? handleStopRecording : handleStartRecording}
                                disabled={isVoiceInputActive}
                                style={{ backgroundColor: isRecording ? '#dc3545' : '#28a745' }}
                            >
                                {recordButtonText}
                            </button>
                        </div>
                    )}
                    {recordingWarning && <p className="error-message">录音即将结束，请尽快完成！</p>}
                    {recordingTime > 0 && <p>录音时长: {recordingTime} 秒</p>}
                    {audioUrl && <audio src={audioUrl} controls />}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                        {questions.length > 0 && (
                            <button type="button" onClick={handleSaveAndNext} disabled={loading} style={{ marginTop: '10px', backgroundColor: '#007bff' }}>
                                {loading ? '正在保存...' : '保存&下一题'}
                            </button>
                        )}
                        {!isCustomInputMode && questions.length > 0 && (
                            <button type="button" onClick={handleSkipQuestion} style={{ marginTop: '10px', backgroundColor: disableSkip ? '#ddd' : '#6c757d' }} disabled={disableSkip}
                            onMouseEnter={() => setProblemInputMessage(disableSkip ? '请先保存当前问题内容' : '')}
                            onMouseLeave={() => setProblemInputMessage('')}
                            >
                                跳过
                            </button>
                        )}
                    </div>
                    {problemInputMessage && <p className="error-message">{problemInputMessage}</p>}
                    {(questions.length > 0 || isCustomInputMode) && (
                        <button type="button" onClick={handleClearInput} style={{ marginTop: '10px', backgroundColor: '#dc3545' }}>清空</button>
                    )}
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
                    {showConfirmModal && (
                        <div className="modal">
                            <div className="modal-content">
                                <p>当前有未保存的内容，是否保存后再切换模式？</p>
                                <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                                    <button type="button" onClick={() => toggleMode(true)} style={{ backgroundColor: '#28a745' }}>保存并切换</button>
                                    <button type="button" onClick={() => toggleMode(false)} style={{ backgroundColor: '#dc3545' }}>不保存并切换</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            );
        }

        export default LazyDiaryPage;
