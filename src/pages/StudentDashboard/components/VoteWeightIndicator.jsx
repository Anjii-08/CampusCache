import React from 'react';

const VoteWeightIndicator = ({ weight, isVisible }) => {
    if (!isVisible) return null;

    return (
        <div className={`
            fixed bottom-4 right-4 
            bg-indigo-600 text-white 
            px-4 py-2 rounded-lg 
            shadow-lg
            transform transition-transform duration-300 ease-out
            ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}
        `}>
            <div className="text-sm font-medium">Vote Weight</div>
            <div className="text-2xl font-bold">{weight.toFixed(1)}x</div>
        </div>
    );
};

export default VoteWeightIndicator;