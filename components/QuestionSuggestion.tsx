import React from 'react';
import { QuestionSuggestion } from '../types';

interface QuestionSuggestionProps {
  suggestions: QuestionSuggestion[];
  onSuggestionClick: (suggestionText: string) => void;
}

const QuestionSuggestionComponent: React.FC<QuestionSuggestionProps> = ({ 
  suggestions, 
  onSuggestionClick 
}) => {
  if (suggestions.length === 0) return null;

  return (
    <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
      <p className="text-sm text-blue-700 font-medium mb-2 flex items-center">
        <i className="fas fa-lightbulb mr-2"></i>
        関連する質問
      </p>
      <div className="space-y-2">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion.id}
            onClick={() => onSuggestionClick(suggestion.text)}
            className="w-full text-left p-2 text-sm bg-white border border-blue-300 rounded-md hover:bg-blue-100 hover:border-blue-400 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
          >
            <i className="fas fa-comment-dots mr-2 text-blue-500"></i>
            {suggestion.text}
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuestionSuggestionComponent; 