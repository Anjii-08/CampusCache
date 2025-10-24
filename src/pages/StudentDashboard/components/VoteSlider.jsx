import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AppContent } from '../../../context/AppContext';
import { toast } from 'react-toastify';

const VoteSlider = ({ answerId, initialValue = 0.5 }) => {
  const { backendUrl, userData } = useContext(AppContent);
  const [value, setValue] = useState(initialValue);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Get the current user's vote for this answer if it exists
    const fetchVote = async () => {
      if (!userData?._id) return;
      
      try {
        const response = await axios.get(`${backendUrl}/api/vote/get-vote`, {
          params: {
            userId: userData._id,
            answerId
          }
        });
        
        if (response.data.success && response.data.vote) {
          setValue(response.data.vote.usefulnessScore);
        }
      } catch (error) {
        console.error('Failed to fetch vote:', error);
      }
    };

    fetchVote();
  }, [answerId, backendUrl, userData]);

  // Debounced vote submission
  useEffect(() => {
    if (!isDragging && !isSubmitting) {
      const timer = setTimeout(async () => {
        if (!userData?._id) return;

        setIsSubmitting(true);
        try {
          const response = await axios.post(`${backendUrl}/api/vote/add-vote`, {
            userId: userData._id,
            answerId,
            usefulnessScore: value
          });

          if (response.data.success) {
            toast.success('Vote recorded', {
              position: 'bottom-right',
              autoClose: 2000,
              hideProgressBar: true
            });
          }
        } catch (err) {
          toast.error('Failed to record vote', {
            position: 'bottom-right',
            autoClose: 2000,
            hideProgressBar: true
          });
        } finally {
          setIsSubmitting(false);
        }
      }, 500); // Wait 500ms after the user stops dragging

      return () => clearTimeout(timer);
    }
  }, [value, isDragging, isSubmitting, answerId, backendUrl, userData]);

  return (
    <div className="w-20 py-4 px-2 bg-white rounded-lg shadow-sm border border-gray-100">
      {/* Vote Percentage Display */}
      <div className="text-center mb-2">
        <span className="text-lg font-semibold text-indigo-600">
          {Math.round(value * 100)}%
        </span>
      </div>

      {/* Slider Track */}
      <div className="relative h-32 flex items-center justify-center">
        {/* Background Track */}
        <div className="absolute h-full w-1 bg-gray-200 rounded-full" />
        
        {/* Colored Track */}
        <div 
          className="absolute bottom-0 w-1 bg-indigo-500 rounded-full transition-all duration-200"
          style={{ height: `${value * 100}%` }}
        />

        {/* Slider Input */}
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={value}
          onChange={(e) => setValue(parseFloat(e.target.value))}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          onTouchStart={() => setIsDragging(true)}
          onTouchEnd={() => setIsDragging(false)}
          className="absolute h-full w-6 opacity-0 cursor-pointer"
          style={{
            WebkitAppearance: 'slider-vertical',
            appearance: 'slider-vertical',
            background: 'transparent'
          }}
        />

        {/* Thumb */}
        <div 
          className="absolute w-4 h-4 bg-white border-2 border-indigo-500 rounded-full shadow transform -translate-x-1/2 transition-all duration-200"
          style={{ bottom: `calc(${value * 100}% - 8px)`, left: '50%' }}
        />
      </div>

      {/* Labels */}
      <div className="text-center mt-2 space-y-1">
        <div className="text-xs font-medium text-green-600">Useful</div>
        <div className="text-xs font-medium text-red-600">Not Useful</div>
      </div>
    </div>
  );
};

export default VoteSlider;