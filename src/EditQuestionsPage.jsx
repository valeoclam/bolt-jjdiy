import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fhcsffagxchzpxouuiuq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZoY3NmZmFneGNoenB4b3V1aXVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzYyMTQzMzAsImV4cCI6MjA1MTc5MDMzMH0.1DMl870gjGRq5LRlQMES9WpYWehiKiPIea2Yj1q4Pz8';
const supabase = createClient(supabaseUrl, supabaseKey);

function EditQuestionsPage({ loggedInUser, onLogout }) {
  const [questions, setQuestions] = useState([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [newQuestionType, setNewQuestionType] = useState('text'); // 新增问题类型状态，默认值为 text
  const [editingQuestionId, setEditingQuestionId] = useState(null);
  const [editedQuestion, setEditedQuestion] = useState('');
  const [editedQuestionType, setEditedQuestionType] = useState('single'); // 新增编辑问题类型状态
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
          .insert([{ question: newQuestion, is_fixed: isFixed, type: newQuestionType, options: newOptions }]);

        if (error) {
          console.error('添加问题时发生错误:', error);
        } else if (data && data.length > 0) {
          console.log('问题添加成功:', data);
          setNewQuestion('');
          setIsFixed(false);
          setNewQuestionType('text'); // 重置问题类型
          setNewOptions(['']); // 重置选项
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

  const handleEditQuestion = (id, question, isFixed, type, options) => {
    setEditingQuestionId(id);
    setEditedQuestion(question);
    setEditedIsFixed(isFixed);
    setEditedQuestionType(type); // 设置编辑问题类型
    setEditedOptions(options || []); // 设置编辑选项
  };

  const handleUpdateQuestion = async (id) => {
    if (editedQuestion && loggedInUser && loggedInUser.role === 'admin') {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('lazy_diary_questions')
          .update({ question: editedQuestion, updated_at: new Date().toISOString(), is_fixed: editedIsFixed, type: editedQuestionType, options: editedOptions })
          .eq('id', id);

        if (error) {
          console.error('更新问题时发生错误:', error);
        } else {
          console.log('问题更新成功:', data);
          setQuestions((prevQuestions) =>
            prevQuestions.map((question) =>
              question.id === id ? { ...question, question: editedQuestion, updated_at: new Date().toISOString(), is_fixed: editedIsFixed, type: editedQuestionType, options: editedOptions } : question,
            ),
          );
          setEditingQuestionId(null);
          setEditedQuestion('');
          setEditedIsFixed(false);
          setEditedQuestionType('single'); // 重置编辑问题类型
          setEditedOptions([]); // 重置编辑选项
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
    setEditedQuestionType('single'); // 重置编辑问题类型
    setEditedOptions([]); // 重置编辑选项
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
                    style={{ marginRight: '5px', color: option }}
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
                          style={{ marginRight: '5px', color: option }}
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
                      <button onClick={() => handleEditQuestion(question.id, question.question, question.is_fixed, question.type, question.options)}>编辑</button>
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
