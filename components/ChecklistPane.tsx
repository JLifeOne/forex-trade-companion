
import React, { useState, useEffect } from 'react';
import { ChecklistItem } from '../types';
import { getChecklistItems, saveChecklistItems } from '../services/storageService';
import { FaClipboardCheck, FaPlus, FaTrash, FaEdit, FaSave } from 'react-icons/fa';

const ChecklistPane: React.FC = () => {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [newItemText, setNewItemText] = useState('');
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingItemText, setEditingItemText] = useState('');

  useEffect(() => {
    setItems(getChecklistItems());
  }, []);

  const handleToggleCheck = (id: string) => {
    const updatedItems = items.map(item =>
      item.id === id ? { ...item, checked: !item.checked } : item
    );
    setItems(updatedItems);
    saveChecklistItems(updatedItems);
  };

  const handleAddItem = () => {
    if (newItemText.trim() === '') return;
    const newItem: ChecklistItem = {
      id: Date.now().toString(),
      text: newItemText.trim(),
      checked: false,
    };
    const updatedItems = [...items, newItem];
    setItems(updatedItems);
    saveChecklistItems(updatedItems);
    setNewItemText('');
  };
  
  const handleRemoveItem = (id: string) => {
    const updatedItems = items.filter(item => item.id !== id);
    setItems(updatedItems);
    saveChecklistItems(updatedItems);
  };

  const handleEditItem = (item: ChecklistItem) => {
    setEditingItemId(item.id);
    setEditingItemText(item.text);
  };

  const handleSaveEdit = (id: string) => {
    if (editingItemText.trim() === '') return;
    const updatedItems = items.map(item =>
      item.id === id ? { ...item, text: editingItemText.trim() } : item
    );
    setItems(updatedItems);
    saveChecklistItems(updatedItems);
    setEditingItemId(null);
    setEditingItemText('');
  };


  const allChecked = items.length > 0 && items.every(item => item.checked);

  return (
    <div className="bg-gray-800 rounded-xl shadow-xl p-6">
      <h2 className="text-xl font-semibold text-indigo-300 mb-6 flex items-center">
        <span className="mr-3 text-indigo-400"><FaClipboardCheck /></span>
        Pre-Trade Checklist
      </h2>
      
      <div className="mb-4 flex gap-2">
        <input 
          type="text"
          value={newItemText}
          onChange={(e) => setNewItemText(e.target.value)}
          placeholder="Add new checklist item"
          className="flex-grow bg-gray-700 text-white p-2 rounded-md border border-gray-600 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
        />
        <button 
          onClick={handleAddItem}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold p-2 rounded-md shadow-sm transition-colors duration-150 flex items-center"
        >
          <span className="mr-1 sm:mr-2"><FaPlus /></span> <span className="hidden sm:inline">Add</span>
        </button>
      </div>

      {items.length === 0 ? (
        <p className="text-gray-400 text-center py-4">No checklist items yet. Add some to get started!</p>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
          {items.map(item => (
            <div key={item.id} className="flex items-center justify-between bg-gray-700 p-3 rounded-lg shadow-sm hover:bg-gray-600/70 transition-colors">
              {editingItemId === item.id ? (
                <input 
                  type="text"
                  value={editingItemText}
                  onChange={(e) => setEditingItemText(e.target.value)}
                  className="flex-grow bg-gray-600 text-white p-1 rounded border border-gray-500 mr-2"
                  autoFocus
                />
              ) : (
                <label className="flex items-center space-x-3 cursor-pointer flex-grow">
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={() => handleToggleCheck(item.id)}
                    className="form-checkbox h-5 w-5 text-indigo-500 bg-gray-800 border-gray-600 rounded focus:ring-indigo-400 focus:ring-offset-gray-800"
                  />
                  <span className={`text-sm ${item.checked ? 'line-through text-gray-500' : 'text-gray-200'}`}>
                    {item.text}
                  </span>
                </label>
              )}
              <div className="flex space-x-2">
                {editingItemId === item.id ? (
                   <button onClick={() => handleSaveEdit(item.id)} className="text-green-400 hover:text-green-300 p-1" title="Save">
                    <FaSave size={16}/>
                  </button>
                ) : (
                  <button onClick={() => handleEditItem(item)} className="text-yellow-400 hover:text-yellow-300 p-1" title="Edit">
                    <FaEdit size={16}/>
                  </button>
                )}
                <button onClick={() => handleRemoveItem(item.id)} className="text-red-400 hover:text-red-300 p-1" title="Delete">
                  <FaTrash size={16}/>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        disabled={!allChecked}
        className={`w-full mt-6 py-3 font-semibold rounded-md shadow-lg transition-all duration-200 text-sm
          ${allChecked ? 'bg-green-500 hover:bg-green-600 text-white transform hover:scale-105' 
                      : 'bg-gray-600 text-gray-400 cursor-not-allowed'}`}
      >
        {allChecked ? 'All Checked - Ready to Trade!' : 'Complete Checklist to Proceed'}
      </button>
    </div>
  );
};

export default ChecklistPane;
