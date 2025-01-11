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
      const [inputType, setInputType] = useState('audio'); // 'audio' or 'voice'
      const timerRef = useRef(null);

      useEffect(() => {
        if (loggedInUser) {
          setLoading(true);
          fetchQuestions();
          fetchTodayRecord();
        }
      }, [loggedInUser]);

      useEffect(() => {
        let intervalId;
        if (isRecording && inputType === 'audio') {
          intervalId = setInterval(() => {
            setRecordingTime((prevTime) => prevTime + 1);
          }, 1000);
        } else {
          clearInterval(intervalId);
          setRecordingTime(0);
          setRecordingWarning(false);
        }
        return () => clearInterval(intervalId);
      }, [isRecording, inputType]);

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
            const fixedQuestion = data.find(question => question.is_fixed);
            if (fixedQuestion) {
              setCurrentQuestion(fixedQuestion.question);
            } else if (data && data.length > 0) {
              setCurrentQuestion(data[0].question);
            }
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
            .single({
              headers: {
                'Accept': 'application/json',
              },
            });

          if (error) {
            if (error.code !== '404') {
              console.error('获取今日懒人日记记录时发生错误:', error);
              setErrorMessage('获取今日懒人日记记录失败，请重试。');
            } else {
               setNoRecordMessage('还没有今日的记录，请开始记录吧！');
               setCurrentRecord(null);
               setErrorMessage('');
            }
          } else {
            setCurrentRecord(data);
            if (data && data.answers) {
              setQuestionIndex(data.answers.length);
            }
            setNoRecordMessage('');
          }
        } catch (error) {
          console.error('发生意外错误:', error);
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

      const handleSaveAndNext = async () => {
        if (currentQuestion && answer) {
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

            const newAnswer = {
              question: currentQuestion,
              answer: answer,
            };

            let updatedAnswers = currentRecord ? [...currentRecord.answers, newAnswer] : [newAnswer];
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

            if (currentRecord) {
              const { data, error } = await supabase
                .from('lazy_diary_records')
                .update({ answers: updatedAnswers, updated_at: new Date().toISOString(), photos: tempDiaryPhotos, audio_path: audioPath })
                .eq('id', currentRecord.id);

              if (error) {
                console.error('更新懒人日记记录时发生错误:', error);
                setErrorMessage('更新懒人日记记录失败，请重试。' + error.message);
              } else {
                console.log('懒人日记记录更新成功:', data);
                setCurrentRecord(prevRecord => ({ ...prevRecord, answers: updatedAnswers, updated_at: new Date().toISOString(), photos: tempDiaryPhotos, audio_path: audioPath }));
                setSuccessMessage('懒人日记记录更新成功!');
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
              }
            } else {
              const newRecord = {
                user_id: userData.id,
                answers: updatedAnswers,
                photos: tempDiaryPhotos,
                audio_path: audioPath,
              };

              const { data, error } = await supabase
                .from('lazy_diary_records')
                .insert([newRecord]);

              if (error) {
                console.error('添加懒人日记记录时发生错误:', error);
                setErrorMessage('添加懒人日记记录失败，请重试。' + error.message);
              } else {
                 console.log('懒人日记记录添加成功:', data);
                setCurrentRecord({ ...newRecord, id: data[0].id, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), photos: tempDiaryPhotos, audio_path: audioPath });
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
              }
            }
          } catch (error) {
            console.error('发生意外错误:', error);
            setErrorMessage('发生意外错误，请重试。' + error.message);
          } finally {
            setLoading(false);
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

      const handleStartRecording = async () => {
        setIsRecording(true);
        setAudioBlob(null);
        setAudioUrl(null);
        if (recognitionRef.current) {
          recognitionRef.current.stop();
        }
        if (inputType === 'audio') {
          try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
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
          }
        } else {
          handleVoiceInput();
        }
      };

      const handleStopRecording = () => {
        if (mediaRecorder) {
          mediaRecorder.stop();
          setIsRecording(false);
        }
        if (recognitionRef.current) {
          recognitionRef.current.stop();
          setIsRecording(false);
          handleSaveAndNext();
        }
      };

      const handleVoiceInput = () => {
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

      const handleStopVoiceInput = () => {
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
              disabled={isRecording}
              style={{ backgroundColor: '#28a745' }}
            >
              {isRecording ? '正在录音/语音输入...' : '开始录音/语音输入'}
            </button>
            <button
              type="button"
              onClick={handleStopRecording}
              disabled={!isRecording}
              style={{ backgroundColor: '#dc3545' }}
            >
              停止
            </button>
            <select
              value={inputType}
              onChange={(e) => setInputType(e.target.value)}
            >
              <option value="audio">录音</option>
              <option value="voice">语音输入</option>
            </select>
          </div>
          {recordingWarning && <p className="error-message">录音即将结束，请尽快完成！</p>}
          {recordingTime > 0 && <p>录音时长: {recordingTime} 秒</p>}
          {audioUrl && <audio src={audioUrl} controls />}
          <button type="button" onClick={handleSaveAndNext} disabled={loading} style={{ marginTop: '10px', backgroundColor: '#007bff' }}>
            {loading ? '正在保存...' : '保存并进入下一个问题'}
          </button>
          {successMessage && <p className="success-message">{successMessage}</p>}
          {errorMessage && <p className="error-message">{errorMessage}</p>}
          {noRecordMessage && <p className="error-message">{noRecordMessage}</p>}
          <div className="inspiration-list">
            <h3>今日记录</h3>
             {currentRecord && currentRecord.answers && currentRecord.answers.length > 0 ? (
              currentRecord.answers.map((record, index) => (
                <div key={index} className="inspiration-item">
                  <p><strong>问题:</strong> {record.question}</p>
                  <p><strong>回答:</strong> {record.answer}</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                    {Array.isArray(currentRecord.photos) &&
                      currentRecord.photos.map((photo, index) => (
                        <img key={index} src={photo} alt={`Diary ${index + 1}`} style={{ maxWidth: '100%', maxHeight: '150px', display: 'block', objectFit: 'contain', marginRight: '5px', marginBottom: '5px' }} />
                      ))}
                  </div>
                   {currentRecord.audio_path && (
                      <audio src={`${supabaseUrl}/storage/v1/object/public/${currentRecord.audio_path}`} controls />
                    )}
                </div>
              ))
            ) : null}
          </div>
          <button type="button" onClick={handleViewHistory} style={{ marginTop: '10px', backgroundColor: '#28a745' }}>查看历史记录</button>
          <button type="button" onClick={handleBackToModules} style={{ marginTop: '10px', backgroundColor: '#6c757d' }}>返回神奇百宝箱</button>
        </div>
      );
    }

    export default LazyDiaryPage;
