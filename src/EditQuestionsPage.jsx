import React, { useState, useEffect, useRef } from 'react';
    import { useNavigate } from 'react-router-dom';
    import { createClient } from '@supabase/supabase-js';

    const supabaseUrl = 'https://fhcsffagxchzpxouuiuq.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZoY3NmZmFneGNoenB4b3V1aXVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzYyMTQzMzAsImV4cCI6MjA1MTc5MDMzMH0.1DMl870gjGRq5LRlQMES9WpYWehiKiPIea2Yj1q4Pz8';
    const supabase = createClient(supabaseUrl, supabaseKey);

    function EditQuestionsPage({ loggedInUser, onLogout }) {
      const [questions, setQuestions] = useState([]);
      const [newQuestion, setNewQuestion] = useState('');
      const [editingQuestionId, setEditingQuestionId] = useState(null);
      const [editedQuestion, setEditedQuestion] = useState('');
      const [confirmDeleteId, setConfirmDeleteId] = useState(null);
      const navigate = useNavigate();
      const [loading, setLoading] = useState(false);
      const containerRef = useRef(null);
      const [searchKeyword, setSearchKeyword] = useState('');
      const [filteredQuestions, setFilteredQuestions] = useState([]);
      const [addSuccessMessage, setAddSuccessMessage] = useState('');
      const [updateSuccessMessage, setUpdateSuccessMessage] = useState('');
      const addTimeoutRef = useRef(null);
      const [isFixed, setIsFixed] = useState(false);
      const [editedIsFixed, setEditedIsFixed] = useState(false);

      useEffect(() => {
        if (loggedInUser) {
          setLoading(true);
          fetchQuestions();
        }
      }, [loggedInUser]);

      useEffect(() => {
        filterQuestions();
      }, [questions, searchKeyword]);

      const fetchQuestions = async () => {
        try {
          const { data, error } = await supabase
            .from('lazy_diary_questions')
            .select('*')
            .order('created_at', { ascending: false });

          if (error) {
            console.error('获取问题列表时发生错误:', error);
          } else {
            setQuestions(data || []);
          }
        } catch (error) {
          console.error('发生意外错误:', error);
        } finally {
          setLoading(false);
        }
      };

      const filterQuestions = () => {
        if (searchKeyword) {
          const filtered = questions.filter(question =>
            question.question.toLowerCase().includes(searchKeyword.toLowerCase())
          );
          setFilteredQuestions(filtered);
        } else {
          setFilteredQuestions(questions);
        }
      };

      const handleAddQuestion = async () => {
        if (newQuestion && loggedInUser && loggedInUser.role === 'admin') {
          setLoading(true);
          try {
            const { data, error } = await supabase
              .from('lazy_diary_questions')
              .insert([{ question: newQuestion, is_fixed: isFixed }]);

            if (error) {
              console.error('添加问题时发生错误:', error);
            } else if (data && data.length > 0) {
              console.log('问题添加成功:', data);
              setNewQuestion('');
              setIsFixed(false);
              setAddSuccessMessage('问题添加成功!');
              if (addTimeoutRef.current) {
                clearTimeout(addTimeoutRef.current);
              }
              addTimeoutRef.current = setTimeout(() => setAddSuccessMessage(''), 3000);
              fetchQuestions();
            }
          } catch (error) {
            console.error('发生意外错误:', error);
          } finally {
            setLoading(false);
          }
        }
      };

      const handleEditQuestion = (id, question, isFixed) => {
        setEditingQuestionId(id);
        setEditedQuestion(question);
        setEditedIsFixed(isFixed);
      };

      const handleUpdateQuestion = async (id) => {
        if (editedQuestion && loggedInUser && loggedInUser.role === 'admin') {
          setLoading(true);
          try {
            const { data, error } = await supabase
              .from('lazy_diary_questions')
              .update({ question: editedQuestion, updated_at: new Date().toISOString(), is_fixed: editedIsFixed })
              .eq('id', id);

            if (error) {
              console.error('更新问题时发生错误:', error);
            } else {
              console.log('问题更新成功:', data);
              setQuestions((prevQuestions) =>
                prevQuestions.map((question) =>
                  question.id === id ? { ...question, question: editedQuestion, updated_at: new Date().toISOString(), is_fixed: editedIsFixed } : question,
                ),
              );
              setEditingQuestionId(null);
              setEditedQuestion('');
              setEditedIsFixed(false);
              setUpdateSuccessMessage('问题更新成功!');
              setTimeout(() => setUpdateSuccessMessage(''), 3000);
            }
          } catch (error) {
            console.error('发生意外错误:', error);
          } finally {
            setLoading(false);
          }
        }
      };

      const handleDeleteQuestion = async (id) => {
        if (confirmDeleteId === id && loggedInUser && loggedInUser.role === 'admin') {
          setLoading(true);
          try {
            const { data, error } = await supabase
              .from('lazy_diary_questions')
              .delete()
              .eq('id', id);

            if (error) {
              console.error('删除问题时发生错误:', error);
            } else {
              console.log('问题删除成功:', data);
              setQuestions((prevQuestions) => prevQuestions.filter((question) => question.id !== id));
              setConfirmDeleteId(null);
            }
          } catch (error) {
            console.error('发生意外错误:', error);
          } finally {
            setLoading(false);
          }
        } else {
          setConfirmDeleteId(id);
        }
      };

      const handleCancelEdit = () => {
        setEditingQuestionId(null);
        setEditedQuestion('');
        setEditedIsFixed(false);
      };

      const handleBackToModules = () => {
        navigate('/modules');
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
          <h2>问题库管理</h2>
          {loggedInUser && <p>当前用户: {loggedInUser.username}</p>}
          <button type="button" onClick={onLogout} className="logout-button">退出</button>
          <button type="button" onClick={handleBackToModules} style={{ marginTop: '10px', backgroundColor: '#6c757d' }}>返回神奇百宝箱</button>
          {addSuccessMessage && <p className="success-message">{addSuccessMessage}</p>}
          {updateSuccessMessage && <p className="success-message">{updateSuccessMessage}</p>}
          {loggedInUser && loggedInUser.role === 'admin' && (
            <div className="form-group">
              <label htmlFor="newQuestion">新增问题:</label>
              <input
                type="text"
                id="newQuestion"
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
              />
              <label>
                <input
                  type="checkbox"
                  checked={isFixed}
                  onChange={() => setIsFixed(!isFixed)}
                />
                固定问题
              </label>
              <button type="button" onClick={handleAddQuestion} style={{ marginTop: '10px', backgroundColor: '#28a745' }} disabled={loading}>
                {loading ? '正在保存...' : '添加'}
              </button>
            </div>
          )}
          <div className="form-group">
            <label htmlFor="searchKeyword">搜索问题:</label>
            <input
              type="text"
              id="searchKeyword"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="输入关键字搜索"
            />
          </div>
          <div className="inspiration-list">
            <h3>问题列表</h3>
            {filteredQuestions.map((question) => (
              <div key={question.id} className="inspiration-item">
                {editingQuestionId === question.id ? (
                  <>
                    <textarea
                      value={editedQuestion}
                      onChange={(e) => setEditedQuestion(e.target.value)}
                      style={{ height: '80px' }}
                    />
                    <label>
                      <input
                        type="checkbox"
                        checked={editedIsFixed}
                        onChange={() => setEditedIsFixed(!editedIsFixed)}
                      />
                      固定问题
                    </label>
                    <div className="edit-buttons">
                      <button onClick={() => handleUpdateQuestion(question.id)} disabled={loading}>
                        {loading ? '正在保存...' : '更新'}
                      </button>
                      <button onClick={handleCancelEdit} style={{ backgroundColor: '#6c757d' }}>取消</button>
                    </div>
                  </>
                ) : (
                  <>
                    <p>{question.question}</p>
                    <p><strong>类型:</strong> {question.is_fixed ? '固定问题' : '随机问题'}</p>
                    <div className="edit-buttons">
                      {loggedInUser && loggedInUser.role === 'admin' && (
                        <>
                          <button onClick={() => handleEditQuestion(question.id, question.question, question.is_fixed)}>编辑</button>
                          <button onClick={() => handleDeleteQuestion(question.id)} style={{ backgroundColor: '#dc3545' }}>
                            {confirmDeleteId === question.id ? '确认删除' : '删除'}
                          </button>
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      );
    }

    export default EditQuestionsPage;
