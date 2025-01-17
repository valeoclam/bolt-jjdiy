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
    const [answer, setAnswer] = useState('');
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [answeredFixedQuestion, setAnsweredFixedQuestion] = useState(false);
    const [disableSkip, setDisableSkip] = useState(false);
    const [previousQuestions, setPreviousQuestions] = useState([]);
    const [initialQuestionLoaded, setInitialQuestionLoaded] = useState(false);
    const [currentQuestionType, setCurrentQuestionType] = useState('text');
    const visitedQuestionsRef = useRef([]);
    const questionIndexRef = useRef(0);
    const [answeredQuestionsToday, setAnsweredQuestionsToday] = useState([]);
    const [selectedOptions, setSelectedOptions] = useState([]);
    const [isOptionSelected, setIsOptionSelected] = useState(false);
    const [questionIndex, setQuestionIndex] = useState(0);

    useEffect(() => {
        if (loggedInUser) {
            setLoading(true);
            fetchQuestions();
            fetchTodayRecord();
        }
    }, [loggedInUser]);

    useEffect(() => {
        if (questions && questions.length > 0) {
            if (!initialQuestionLoaded) {
                // Find the first non-answered fixed question
                const fixedQuestion = questions.find(question => question.is_fixed && !answeredQuestionsToday.includes(question.id));
                let initialIndex = 0;
                if (fixedQuestion) {
                    initialIndex = questions.findIndex(q => q.id === fixedQuestion?.id);
                    setCurrentQuestion(fixedQuestion.question);
                    setCurrentQuestionType(fixedQuestion.type);
                } else {
                    // If no non-answered fixed question, find the first non-fixed question
                    const firstNonFixed = questions.find(question => !question.is_fixed && !answeredQuestionsToday.includes(question.id));
                    if (firstNonFixed) {
                        initialIndex = questions.findIndex(q => q.id === firstNonFixed?.id);
                        setCurrentQuestion(firstNonFixed.question);
                        setCurrentQuestionType(firstNonFixed.type);
                    } else {
                        setCurrentQuestion('');
                        setCurrentQuestionType('text');
                        initialIndex = 0;
                    }
                }
                visitedQuestionsRef.current = [initialIndex];
                setVisitedQuestions([initialIndex]);
                questionIndexRef.current = initialIndex;
                setQuestionIndex(initialIndex);
                setInitialQuestionLoaded(true);
            }
        }
    }, [questions, initialQuestionLoaded, answeredQuestionsToday]);

    useEffect(() => {
        setDisableSkip(!!(answer || selectedOptions.length > 0));
    }, [answer, selectedOptions]);

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
            console.error('发生意外错误:',
 error);
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
                    } else {
                        // Extract answered question IDs
                        const answeredIds = answersData.map(answer => {
                            try {
                                return questions.find(q => q.question === answer.question)?.id;
                            } catch (e) {
                                return null;
                            }
                        }).filter(id => id != null);
                        setAnsweredQuestionsToday(answeredIds);
                    }
                } else {
                    setAnsweredQuestionsToday([]);
                }
            }
        } catch (error) {
            console.error('发生意外错误:', error, error.message);
            setAnsweredQuestionsToday([]);
        }
    };

    const handleAnswerChange = (e) => {
        setAnswer(e.target.value);
    };

    const handleSaveAndNext = async () => {
        setLoading(true);
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

            // Create a new record if currentRecord is null
            let recordId;
            const today = new Date().toISOString().split('T')[0];
            const { data: recordData, error: recordError } = await supabase
                .from('lazy_diary_records')
                .select('*')
                .eq('user_id', loggedInUser.id)
                .gte('created_at', `${today}T00:00:00.000Z`)
                .lt('created_at', `${today}T23:59:59.999Z`)
                .limit(1);

            if (recordError) {
                console.error('获取今日懒人日记记录时发生错误:', recordError, recordError.message);
                const newRecord = {
                    user_id: userData.id,
                };
                const { data: newRecordData, error: newRecordError } = await supabase
                    .from('lazy_diary_records')
                    .insert([newRecord])
                    .select('id');

                if (newRecordError) {
                    console.error('添加懒人日记记录时发生错误:', newRecordError);
                    return;
                } else if (newRecordData && newRecordData.length > 0) {
                    recordId = newRecordData[0].id;
                } else {
                    throw new Error("Failed to create new record or retrieve record ID.");
                }
            } else if (recordData && recordData.length > 0) {
                recordId = recordData[0].id;
            } else {
                throw new Error("Failed to create new record or retrieve record ID.");
            }

            const newAnswer = {
                record_id: recordId,
                question: currentQuestion,
                answer: answer,
                selected_option: currentQuestionType === 'multiple' ? JSON.stringify(selectedOptions) : selectedOptions.join(''),
            };

            const { data, error } = await supabase
                .from('lazy_diary_answers')
                .insert([newAnswer]);

            if (error) {
                console.error('添加懒人日记记录时发生错误:', error);
            } else {
                console.log('懒人日记记录添加成功:', data);
                setAnswer('');
                setSelectedOptions([]);
                setIsOptionSelected(false);
            }
        } catch (error) {
            
            console.error('发生意外错误:', error);
        } finally {
            setLoading(false);
        }
        if (questions && questions.length > 0) {
            setQuestionIndex((prevIndex) => {
                let nextIndex;
                let nextQuestion;
                const fixedQuestion = questions.find(question => question.is_fixed && !answeredQuestionsToday.includes(question.id));
                if (fixedQuestion && !answeredFixedQuestion) {
                    setAnsweredFixedQuestion(true);
                    nextQuestion = questions.find((question, index) => index === (prevIndex + 1) % questions.length && !question.is_fixed && !answeredQuestionsToday.includes(question.id));
                    if (nextQuestion) {
                        nextIndex = questions.findIndex(q => q.id === nextQuestion?.id);
                        setCurrentQuestion(nextQuestion.question);
                        setCurrentQuestionType(nextQuestion.type);
                        console.log('Skip - next question:', nextQuestion.question, 'index:', nextIndex);
                        return nextIndex
                    } else {
                        const firstNonFixed = questions.find(question => !question.is_fixed && !answeredQuestionsToday.includes(question.id));
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
                    if (answeredQuestionsToday.includes(nextQuestion.id)) {
                        const nextNonAnswered = questions.find((question, index) => index > nextIndex && !answeredQuestionsToday.includes(question.id));
                        if (nextNonAnswered) {
                            nextIndex = questions.findIndex(q => q.id === nextNonAnswered?.id);
                            nextQuestion = nextNonAnswered;
                        } else {
                            const firstNonAnswered = questions.find(question => !answeredQuestionsToday.includes(question.id));
                            if (firstNonAnswered) {
                                nextIndex = questions.findIndex(q => q.id === firstNonAnswered?.id);
                                nextQuestion = firstNonAnswered;
                            } else {
                                setCurrentQuestion('');
                                setCurrentQuestionType('text');
                                return 0;
                            }
                        }
                    }
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
        if (questions && questions.length > 0) {
            setPreviousQuestions(prev => [...prev, currentQuestion]);
            setQuestionIndex((prevIndex) => {
                let nextIndex = 0;
                let nextQuestion;
                const fixedQuestion = questions.find(question => question.is_fixed && !answeredQuestionsToday.includes(question.id));
                if (fixedQuestion && !answeredFixedQuestion) {
                    setAnsweredFixedQuestion(true);
                    nextQuestion = questions.find((question, index) => index === (prevIndex + 1) % questions.length && !question.is_fixed && !answeredQuestionsToday.includes(question.id));
                    if (nextQuestion)
{
                        nextIndex = questions.findIndex(q => q.id === nextQuestion?.id);
                        console.log('Skip - next question:', nextQuestion.question, 'index:', nextIndex);
                        setCurrentQuestion(nextQuestion.question);
                        setCurrentQuestionType(nextQuestion.type);
                        return nextIndex;
                    } else {
                        const firstNonFixed = questions.find(question => !question.is_fixed && !answeredQuestionsToday.includes(question.id));
                        if (firstNonFixed) {
                            nextIndex = questions.findIndex(q => q.id === firstNonFixed?.id);
                            console.log('Skip - first non-fixed question:', firstNonFixed.question, 'index:', nextIndex);
                            setCurrentQuestion(firstNonFixed.question);
                            setCurrentQuestionType(firstNonFixed.type);
                            return nextIndex;
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
                    if (answeredQuestionsToday.includes(nextQuestion.id)) {
                        const nextNonAnswered = questions.find((question, index) => index > nextIndex && !answeredQuestionsToday.includes(question.id));
                        if (nextNonAnswered) {
                            nextIndex = questions.findIndex(q => q.id === nextNonAnswered?.id);
                            nextQuestion = nextNonAnswered;
                        } else {
                            const firstNonAnswered = questions.find(question => !answeredQuestionsToday.includes(question.id));
                            if (firstNonAnswered) {
                                nextIndex = questions.findIndex(q => q.id === firstNonAnswered?.id);
                                nextQuestion = firstNonAnswered;
                            } else {
                                setCurrentQuestion('');
                                setCurrentQuestionType('text');
                                return 0;
                            }
                        }
                    }
                    console.log('Skip - next question:', nextQuestion.question, 'index:', nextIndex);
                    setCurrentQuestion(nextQuestion.question);
                    setCurrentQuestionType(nextQuestion.type);
                    return nextIndex
                }
            });
        }
    };

    const handleBackToModules = () => {
        navigate('/modules');
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
            <h2>测试页面</h2>
            {loggedInUser && <p>当前用户: {loggedInUser.username}</p>}
            <button type="button" onClick={onLogout} className="logout-button">退出</button>
            <button type="button" onClick={handleBackToModules} style={{ marginTop: '10px', backgroundColor: '#6c757d' }}>返回神奇百宝箱</button>
            {loading ? <p>加载中...</p> : (
                <>
                    <p>当前问题: {currentQuestion}</p>
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
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
                        <button type="button" onClick={handleSaveAndNext} disabled={loading}>
                            {loading ? '正在保存...' : '保存并下一题'}
                        </button>
                        <button type="button" onClick={handleSkipQuestion} disabled={disableSkip}>跳过</button>
                    </div>
                </>
            )}
        </div>
    );
}

export default TestNavigationPage;
