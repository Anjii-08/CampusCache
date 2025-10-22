import React, { useState, useEffect, useContext } from 'react';
import { AppContent } from '../../../context/AppContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import QuestionForm from './QuestionForm';
import QuestionList from './QuestionList';

const QuestionsSection = () => {
  const { backendUrl, userData } = useContext(AppContent);
  const [showForm, setShowForm] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('all'); // 'all' or 'my'
  const [searchQuery, setSearchQuery] = useState('');
  const [isFiltered, setIsFiltered] = useState(false);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const endpoint = viewMode === 'my' 
        ? `/api/question/user-questions`
        : '/api/question/all-questions';
      const { data } = await axios.get(`${backendUrl}${endpoint}`);
      if (data.success) {
        setQuestions(data.allQuestions || data.userQuestions || []);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch questions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [viewMode]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setIsFiltered(false);
      fetchQuestions();
      return;
    }
    setLoading(true);
    try {
      const { data } = await axios.get(`${backendUrl}/api/question/search?q=${searchQuery}`);
      if (data.success) {
        setQuestions(data.questions || []);
        setIsFiltered(true);
      }
    } catch (error) {
      toast.error('Failed to search questions: ',error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (questionId) => {
    try {
      const { data } = await axios.delete(`${backendUrl}/api/question/delete-question/${questionId}`);
      if (data.success) {
        toast.success('Question deleted successfully');
        fetchQuestions();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete question');
    }
  };

  const handleReport = async (questionId, reason) => {
    try {
      const { data } = await axios.post(`${backendUrl}/api/report`, {
        contentId: questionId,
        contentType: 'Question',
        reasons: reason
      });
      if (data.success) {
        toast.success('Question reported successfully');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to report question');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-4">
          <button
            onClick={() => { setViewMode('all'); setSearchQuery(''); setIsFiltered(false); }}
            className={`px-4 py-2 rounded-lg transition-all duration-200 ${
              viewMode === 'all'
                ? 'bg-indigo-500 text-white'
                : 'bg-white text-indigo-500 border border-indigo-500'
            }`}
          >
            All Questions
          </button>
          <button
            onClick={() => { setViewMode('my'); setSearchQuery(''); setIsFiltered(false); }}
            className={`px-4 py-2 rounded-lg transition-all duration-200 ${
              viewMode === 'my'
                ? 'bg-indigo-500 text-white'
                : 'bg-white text-indigo-500 border border-indigo-500'
            }`}
          >
            My Questions
          </button>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600 transition-colors"
        >
          Ask Question
        </button>
      </div>

      <div className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search questions..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
          />
          <button
              onClick={handleSearch}
              className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
            >
              Search
            </button>
          {isFiltered && (
            <button
              onClick={() => { setSearchQuery(''); setIsFiltered(false); fetchQuestions(); }}
              className="px-4 py-2 bg-red-200 text-red-700 rounded-lg hover:bg-red-300 transition-colors"
            >
              Clear Filter
            </button>
          )}
        </div>
      </div>

      {showForm && (
        <QuestionForm
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            setShowForm(false);
            fetchQuestions();
          }}
        />
      )}

      <QuestionList
        questions={questions}
        loading={loading}
        onDelete={handleDelete}
        onReport={handleReport}
        isUserQuestion={(question) => question.author?._id === userData?._id || question.author === userData?._id}
      />
    </div>
  );
};

export default QuestionsSection;