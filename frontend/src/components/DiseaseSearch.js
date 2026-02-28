import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { Input } from './ui/input';
import { Search, X } from 'lucide-react';
import axios from 'axios';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const DiseaseSearch = ({ currentDiseaseId }) => {
  const { t } = useLanguage();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search diseases
  useEffect(() => {
    const searchDiseases = async () => {
      if (query.length < 2) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        const response = await axios.get(`${API_URL}/diseases`, {
          params: { search: query }
        });
        // Filter out current disease
        const filtered = response.data.filter(d => d.id !== currentDiseaseId);
        setResults(filtered.slice(0, 8)); // Limit to 8 results
      } catch (err) {
        console.error('Search error:', err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(searchDiseases, 300);
    return () => clearTimeout(debounce);
  }, [query, currentDiseaseId]);

  const handleSelect = (diseaseId) => {
    setQuery('');
    setIsOpen(false);
    navigate(`/disease/${diseaseId}`);
  };

  return (
    <div ref={wrapperRef} className="relative w-full max-w-md" data-testid="disease-search">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Quick switch to another disease..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => query.length >= 2 && setIsOpen(true)}
          className="pl-10 pr-8 h-9 bg-white/80 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700"
          data-testid="disease-search-input"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setResults([]);
              inputRef.current?.focus();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Dropdown Results */}
      {isOpen && (query.length >= 2 || results.length > 0) && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-50 max-h-80 overflow-auto">
          {loading ? (
            <div className="p-3 text-center text-slate-500 text-sm">
              Searching...
            </div>
          ) : results.length > 0 ? (
            <ul className="py-1">
              {results.map((disease) => (
                <li key={disease.id}>
                  <button
                    onClick={() => handleSelect(disease.id)}
                    className="w-full px-4 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    data-testid={`search-result-${disease.id}`}
                  >
                    <div className="font-medium text-slate-800 dark:text-slate-200">
                      {disease.name}
                    </div>
                    <div className="text-xs text-slate-500">
                      {disease.category_name}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          ) : query.length >= 2 ? (
            <div className="p-3 text-center text-slate-500 text-sm">
              No diseases found
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};
