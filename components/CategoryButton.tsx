import React from 'react';
import { Category } from '../types';

interface CategoryButtonProps {
  category: Category;
  onSelect: (category: Category) => void;
  isSelected: boolean;
}

const CategoryButton: React.FC<CategoryButtonProps> = ({ category, onSelect, isSelected }) => {
  const selectedClasses = isSelected 
    ? 'bg-pink-600 text-white ring-2 ring-pink-700 ring-offset-1' 
    : 'bg-pink-100 text-pink-700 hover:bg-pink-200';

  return (
    <button
      onClick={() => onSelect(category)}
      className={`flex flex-col items-center justify-center px-2 py-2 rounded-lg shadow-sm transition-all duration-150 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-pink-500 ${selectedClasses} flex-shrink-0`}
      style={{ minWidth: '70px', height: '60px' }}
      aria-pressed={isSelected}
      aria-label={`カテゴリ: ${category.label}`}
    >
      <i className={`${category.icon} text-lg mb-1`}></i>
      <span className="text-xs font-medium text-center leading-tight">{category.label}</span>
    </button>
  );
};

export default CategoryButton;
