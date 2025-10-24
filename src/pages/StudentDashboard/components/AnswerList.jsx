import React, { useState, useContext } from 'react';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import axios from 'axios';
import VoteSlider from './VoteSlider';
import { AppContent } from '../../../context/AppContext';

const AnswerList = ({ answers, loading, onDelete, onReport, isUserAnswer }) => {
  const { backendUrl, userData } = useContext(AppContent);
  const [reportingAnswer, setReportingAnswer] = useState(null);
  const [reportReason, setReportReason] = useState('');

  const handleReport = (answerId) => {
    // Require at least one word character to avoid empty/whitespace-only reasons
    if (!/\w+/.test(reportReason)) {
      toast.error('Provide at least one word for reason to report');
      return;
    }
    const reason = reportReason.trim();
    onReport(answerId, reason);
    setReportingAnswer(null);
    setReportReason('');
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading answers...</p>
      </div>
    );
  }

  if (!answers.length) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">You haven't posted any answers yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {answers.map((answer) => (
        <div key={answer._id} className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-start gap-6">
            {/* Vote Slider */}
            {!isUserAnswer(answer) && (
              <div className="flex-shrink-0 flex items-center justify-center">
                <VoteSlider
                  answerId={answer._id}
                  initialValue={answer.usefulnessScore || 0.5}
                />
              </div>
            )}
            
            {/* Answer Content */}
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Re: {answer.question?.title || 'Question not available'}
              </h3>
              <p className="text-gray-600 whitespace-pre-wrap">{answer.content}</p>
            </div>
            
            <div className="flex-shrink-0">
              {isUserAnswer(answer) ? (
                <button
                  onClick={() => onDelete(answer._id)}
                  className="text-red-500 hover:text-red-700"
                >
                  Delete
                </button>
              ) : (
                <button
                  onClick={() => setReportingAnswer(answer._id)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  Report
                </button>
              )}
            </div>
          </div>

          <div className="flex justify-between items-center text-sm text-gray-500">
            <div>
              Posted by: {answer.isAnonymous ? '-----' : answer.author?.name || '-----'}
            </div>
            <div>
              {format(new Date(answer.createdAt), 'MMM d, yyyy')}
            </div>
          </div>

          {reportingAnswer === answer._id && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <textarea
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                placeholder="Why are you reporting this answer?"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
                rows="3"
              />
              <div className="flex justify-end gap-2 mt-2">
                <button
                  onClick={() => {
                    setReportingAnswer(null);
                    setReportReason('');
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleReport(answer._id)}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                >
                  Submit Report
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default AnswerList;