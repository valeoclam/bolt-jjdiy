import React, { useState, useEffect, useRef } from 'react';
    import { useNavigate } from 'react-router-dom';
    import { createClient } from '@supabase/supabase-js';

    const supabaseUrl = 'https://fhcsffagxchzpxouuiuq.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZoY3NmZmFneGNoenB4b3V1aXVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzYyMTQzMzAsImV4cCI6MjA1MTc5MDMzMH0.1DMl870gjGRq5LRlQMES9WpYWehiKiPIea2Yj1q4Pz8';
    const supabase = createClient(supabaseUrl, supabaseKey);

    function TestNavigationPage({ loggedInUser, onLogout }) {
      const [questions, setQuestions] = useState([]);
      const [questionIndex, setQuestionIndex] = useState(0);
      const [visitedQuestions, setVisitedQuestions] = useState([]);
      const [currentQuestion, setCurrentQuestion] = useState('');
      const navigate = useNavigate();
      const [loading, setLoading] = useState(false);
      const [answeredFixedQuestion, setAnsweredFixedQuestion] = useState(false);
      const [disableSkip, setDisableSkip] = useState(false);
      const [disablePrevious, setDisablePrevious] = useState(true);
      const [previousQuestions, setPreviousQuestions] = useState([]);
      const [initialQuestionLoaded, setInitialQuestionLoaded] = useState(false);
      const [currentQuestionType, setCurrentQuestionType] = useState('text');
      const visitedQuestionsRef = useRef([]);

      useEffect(() => {
        if (loggedInUser) {
          setLoading(true);
          fetchQuestions();
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
                setQuestionIndex(initialIndex);
                setInitialQuestionLoaded(true);
            }
        }
      }, [questions, initialQuestionLoaded]);

      useEffect(() => {
        setDisableSkip(false);
        setDisablePrevious(visitedQuestionsRef.current.length <= 1);
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

      const handleSkipQuestion = () => {
        if (disableSkip) {
            return;
        }
        if (questions && questions.length > 0) {
            setPreviousQuestions(prev => [...prev, currentQuestion]);
            setQuestionIndex(prevIndex => {
                let nextIndex = (prevIndex + 1) % questions.length;
                const fixedQuestion = questions.find(question => question.is_fixed);
                 if (fixedQuestion && !answeredFixedQuestion) {
                    setAnsweredFixedQuestion(true);
                    const nextQuestion = questions.find((question, index) => index === nextIndex && !question.is_fixed);
                    if (nextQuestion) {
                        setCurrentQuestion(nextQuestion.question);
                        setCurrentQuestionType(nextQuestion.type);
                        visitedQuestionsRef.current = [...visitedQuestionsRef.current, nextIndex];
                        setVisitedQuestions(prev => [...prev, nextIndex]);
                        console.log('Skip - next question:', nextQuestion.question, 'index:', nextIndex);
                        return nextIndex
                    } else {
                        const firstNonFixed = questions.find(question => !question.is_fixed);
                         if (firstNonFixed) {
                            setCurrentQuestion(firstNonFixed.question);
                            setCurrentQuestionType(firstNonFixed.type);
                            const newIndex = questions.findIndex(q => q.id === firstNonFixed?.id);
                            visitedQuestionsRef.current = [...visitedQuestionsRef.current, newIndex];
                            setVisitedQuestions(prev => [...prev, newIndex]);
                            console.log('Skip - first non-fixed question:', firstNonFixed.question, 'index:', newIndex);
                            return newIndex
                         } else {
                            setCurrentQuestion('');
                            setCurrentQuestionType('text');
                            return 0;
                         }
                    }
                } else {
                    const nextQuestion = questions[nextIndex];
                    setCurrentQuestion(nextQuestion.question);
                    setCurrentQuestionType(nextQuestion.type);
                    visitedQuestionsRef.current = [...visitedQuestionsRef.current, nextIndex];
                    setVisitedQuestions(prev => [...prev, nextIndex]);
                    console.log('Skip - next question:', nextQuestion.question, 'index:', nextIndex);
                    return nextIndex

                }
            });
        }
    };

    const handlePreviousQuestion = () => {
        if (disablePrevious) {
            return;
        }
        if (visitedQuestionsRef.current.length > 1) {
            const newVisitedQuestions = visitedQuestionsRef.current.slice(0, -1);
            visitedQuestionsRef.current = newVisitedQuestions;
            setVisitedQuestions(newVisitedQuestions);
            if (newVisitedQuestions.length > 0) {
                const previousQuestionIndex = newVisitedQuestions[newVisitedQuestions.length - 1];
                if (previousQuestionIndex !== undefined) {
                    setCurrentQuestion(questions[previousQuestionIndex]?.question);
                    setCurrentQuestionType(questions[previousQuestionIndex]?.type || 'text');
                    setQuestionIndex(previousQuestionIndex);
                    console.log('Previous - question:', questions[previousQuestionIndex]?.question, 'index:', previousQuestionIndex);
                }
            }
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
              <button type="button" onClick={handlePreviousQuestion} disabled={disablePrevious}>上一题</button>
            </>
          )}
        </div>
      );
    }

    export default TestNavigationPage;
