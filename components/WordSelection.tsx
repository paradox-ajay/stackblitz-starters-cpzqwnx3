'use client';

import React from 'react';

interface WordSelectionProps {
  words: string[];
  onSelectWord: (word: string) => void;
}

const WordSelection: React.FC<WordSelectionProps> = ({ words, onSelectWord }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold text-center mb-6">Choose a word to draw</h2>
        <div className="space-y-3">
          {words.map((word) => (
            <button
              key={word}
              onClick={() => onSelectWord(word)}
              className="w-full p-4 text-lg font-medium bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors border-2 border-transparent hover:border-blue-400"
            >
              {word}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WordSelection;