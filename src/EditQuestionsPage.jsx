import React, { useState, useEffect, useRef } from 'react';
    import { useNavigate } from 'react-router-dom';
    import { createClient } from '@supabase/supabase-js';

    const supabaseUrl = 'https://fhcsffagxchzpxouuiuq.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZoY3NmZmFneGNoenB4b3V1aXVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY3OTY0NzAsImV4cCI6MjA1MTc5MDMzMH0.1DMl870gjGRq5LRlQMES9WpYWehiKiPIea2Yj1q4Pz8';
    const supabase = createClient(supabaseUrl, supabaseKey);

    function EditQuestionsPage({ loggedInUser, onLogout, supabase }) {
      const [questions, setQuestions] = useState([]);
      const [newQuestion, setNewQuestion] = useState('');
      const [newQuestionType, setNewQuestionType] = useState('text');
      const [editingQuestionId, setEditingQuestionId] = useState(null);
      const [editedQuestion, setEditedQuestion] = useState('');
      const [editedQuestionType, setEditedQuestionType] = useState('single');
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
      const [newOptions, setNewOptions] = useState(['']);
      const [editedOptions, setEditedOptions] = useState([]);
      const [editedIsActive, setEditedIsActive] = useState(true);
      const [newIsActive, setNewIsActive] = useState(true);
      const [addButtonText, setAddButtonText] = useState('添加到问题库');

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
        setLoading(true);
        try {
          const { data, error } = await supabase
            .from('lazy_diary_questions')
            .select('*')
            .order('created_at', { ascending: false });

          if (error) {
            console.error('获取问题列表时发生错误:', error);
          } else {
            setQuestions(data || []);
            setFilteredQuestions(data || []);
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
          setAddButtonText('正在添加...');
          try {
            const { data, error } = await supabase
              .from('lazy_diary_questions')
              .insert([{ question: newQuestion, is_fixed: isFixed, type: newQuestionType, options: newOptions, is_active: newIsActive }])
              .select('*');

            if (error) {
              console.error('添加问题时发生错误:', error);
              setAddSuccessMessage('添加问题失败，请重试。');
            } else if (data && data.length > 0) {
              console.log('问题添加成功:', data);
              setNewQuestion('');
              setIsFixed(false);
              setNewQuestionType('text');
              setNewOptions(['']);
              setNewIsActive(true);
              setAddSuccessMessage('问题添加成功!');
              if (addTimeoutRef.current) {
                clearTimeout(addTimeoutRef.current);
              }
              addTimeoutRef.current = setTimeout(() => setAddSuccessMessage(''), 3000);
              setQuestions(prevQuestions => [data[0], ...prevQuestions]);
            }
          } catch (error) {
            console.error('发生意外错误:', error);
            setAddSuccessMessage('添加问题失败，请重试。');
          } finally {
            setLoading(false);
            setAddButtonText('添加到问题库');
          }
        }
      };

      const handleEditQuestion = (id, question, isFixed, type, options, is_active) => {
        setEditingQuestionId(id);
        setEditedQuestion(question);
        setEditedIsFixed(isFixed);
        setEditedQuestionType(type);
        setEditedOptions(options || []);
        setEditedIsActive(is_active);
      };

      const handleUpdateQuestion = async (id) => {
        if (editedQuestion && loggedInUser && loggedInUser.role === 'admin') {
          setLoading(true);
          try {
            const { data, error } = await supabase
              .from('lazy_diary_questions')
              .update({ question: editedQuestion, updated_at: new Date().toISOString(), is_fixed: editedIsFixed, type: editedQuestionType, options: editedOptions, is_active: editedIsActive })
              .eq('id', id);

            if (error) {
              console.error('更新问题时发生错误:', error);
            } else {
              console.log('问题更新成功:', data);
              setQuestions((prevQuestions) =>
                prevQuestions.map((question) =>
                  question.id === id ? { ...question, question: editedQuestion, updated_at: new Date().toISOString(), is_fixed: editedIsFixed, type: editedQuestionType, options: editedOptions, is_active: editedIsActive } : question,
                ),
              );
              setEditingQuestionId(null);
              setEditedQuestion('');
              setEditedIsFixed(false);
              setEditedQuestionType('single');
              setEditedOptions([]);
              setEditedIsActive(true);
              setUpdateSuccessMessage('问题更新成功!');
              setTimeout(() => setUpdateSuccessMessage(''), 3000);
              fetchQuestions();
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
              fetchQuestions();
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
        setEditedQuestionType('single');
        setEditedOptions([]);
        setEditedIsActive(true);
      };

      const handleBackToModules = () => {
        navigate('/modules');
      };

      const handleAddOption = () => {
        setNewOptions([...newOptions, '']);
      };

      const handleEditOption = (index, value) => {
        const updatedOptions = [...newOptions];
        updatedOptions[index] = value;
        setNewOptions(updatedOptions);
      };

      const handleDeleteOption = (index) => {
        const updatedOptions = [...newOptions];
        updatedOptions.splice(index, 1);
        setNewOptions(updatedOptions);
      };

      const handleEditEditedOption = (index, value) => {
        const updatedOptions = [...editedOptions];
        updatedOptions[index] = value;
        setEditedOptions(updatedOptions);
      };

      const handleDeleteEditedOption = (index) => {
        const updatedOptions = [...editedOptions];
        updatedOptions.splice(index, 1);
        setEditedOptions(updatedOptions);
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
              <label htmlFor="newQuestionType">问题类型:</label>
              <select
                id="newQuestionType"
                value={newQuestionType}
                onChange={(e) => setNewQuestionType(e.target.value)}
              >
                <option value="single">单选题</option>
                <option value="multiple">多选题</option>
                <option value="text">文本题</option>
              </select>
              {newQuestionType === 'single' || newQuestionType === 'multiple' ? (
                <div>
                  <label>选项:</label>
                  {newOptions.map((option, index) => (
                    <div key={index} style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => handleEditOption(index, e.target.value)}
                        style={{ marginRight: '5px' }}
                      />
                      <button type="button" onClick={() => handleDeleteOption(index)} style={{ backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', padding: '5px 10px', cursor: 'pointer' }}>删除</button>
                    </div>
                  ))}
                  <button type="button" onClick={handleAddOption} style={{ backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', padding: '5px 10px', cursor: 'pointer' }}>添加选项</button>
                </div>
              ) : null}
              <label>
                <input
                  type="checkbox"
                  checked={isFixed}
                  onChange={() => setIsFixed(!isFixed)}
                />
                固定问题
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={newIsActive}
                  onChange={() => setNewIsActive(!newIsActive)}
                />
                启用
              </label>
              <button type="button" onClick={handleAddQuestion} style={{ marginTop: '10px', backgroundColor: '#28a745' }} disabled={loading}>
                {loading ? '正在保存...' : addButtonText}
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
                    <label htmlFor="editedQuestionType">问题类型:</label>
                    <select
                      id="editedQuestionType"
                      value={editedQuestionType}
                      onChange={(e) => setEditedQuestionType(e.target.value)}
                    >
                      <option value="single">单选题</option>
                      <option value="multiple">多选题</option>
                      <option value="text">文本题</option>
                    </select>
                    {editedQuestionType === 'single' || editedQuestionType === 'multiple' ? (
                      <div>
                        <label>选项:</label>
                        {editedOptions.map((option, index) => (
                          <div key={index} style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
                            <input
                              type="text"
                              value={option}
                              onChange={(e) => handleEditEditedOption(index, e.target.value)}
                              style={{ marginRight: '5px' }}
                            />
                            <button type="button" onClick={() => handleDeleteEditedOption(index)} style={{ backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', padding: '5px 10px', cursor: 'pointer' }}>删除</button>
                          </div>
                        ))}
                      </div>
                    ) : null}
                    <label>
                      <input
                        type="checkbox"
                        checked={editedIsFixed}
                        onChange={() => setEditedIsFixed(!editedIsFixed)}
                      />
                      固定问题
                    </label>
                     <label>
                      <input
                        type="checkbox"
                        checked={editedIsActive}
                        onChange={() => setEditedIsActive(!editedIsActive)}
                      />
                      启用
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
                    <p><strong>类型:</strong> {question.type === 'single' ? '单选题' : question.type === 'multiple' ? '多选题' : '文本题'}</p>
                    <p><strong>类型:</strong> {question.is_fixed ? '固定问题' : '随机问题'}</p>
                     <p><strong>状态:</strong> {question.is_active ? '启用' : '禁用'}</p>
                    {question.options && question.options.length > 0 && (
                      <div>
                        <label>选项:</label>
                        {question.options.map((option, index) => (
                          <p key={index} style={{ color: option }}>{option}</p>
                        ))}
                      </div>
                    )}
                    <div className="edit-buttons">
                      {loggedInUser && loggedInUser.role === 'admin' && (
                        <>
                          <button onClick={() => handleEditQuestion(question.id, question.question, question.is_fixed, question.type, question.options, question.is_active)}>编辑</button>
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
