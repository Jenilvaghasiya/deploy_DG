// components/BOM/BOMAutocompleteInput.jsx - MODIFIED

import { useState, useEffect, useRef } from "react";
import api from "@/api/axios";
import { ChevronDown, Plus } from "lucide-react";

// DEFAULT SUGGESTIONS as fallback
const DEFAULT_SUGGESTIONS = {
  item: ["Fabric", "Trims", "Packaging Materials", "Labels", "Buttons", "Zippers", "Thread", "Elastic", "Lining", "Interlining"],
  subItem: ["Main Body", "Sleeves", "Collar", "Cuffs", "Pockets", "Waistband", "Hem", "Yoke", "Placket"],
  material: ["100% Cotton", "Cotton-Polyester Blend", "Polyester", "Nylon", "Spandex", "Lycra", "Wool", "Silk", "Denim", "Fleece", "Jersey Knit", "Rib Knit", "Mesh"],
  unit: ["Pcs", "Kgs", "Meters", "Yards", "Grams", "Dozens", "Sets", "Rolls"]
};

export default function BOMAutocompleteInput({ 
  fieldType, 
  value, 
  onChange, 
  placeholder,
  allowCustom = true
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        inputRef.current &&
        !inputRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchSuggestions = async (searchTerm = "") => {
    try {
      setLoading(true);
      const response = await api.get("/image-variation/bom/autocomplete", {
        params: { fieldType, search: searchTerm },
      });

      const fetchedSuggestions = response.data?.data?.suggestions || [];
      
      // Combine fetched + defaults, remove duplicates
      const defaults = DEFAULT_SUGGESTIONS[fieldType] || [];
      const combined = [...new Set([...fetchedSuggestions, ...defaults])];
      
      const filtered = searchTerm 
        ? combined.filter(s => s.toLowerCase().includes(searchTerm.toLowerCase()))
        : combined;
      
      setSuggestions(filtered);
    } catch (error) {
      console.error("Error fetching autocomplete:", error);
      const defaults = DEFAULT_SUGGESTIONS[fieldType] || [];
      const filtered = searchTerm 
        ? defaults.filter(s => s.toLowerCase().includes(searchTerm.toLowerCase()))
        : defaults;
      setSuggestions(filtered);
    } finally {
      setLoading(false);
    }
  };

  const handleFocus = () => {
    fetchSuggestions(value);
    setShowSuggestions(true);
  };

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    onChange(newValue);
    fetchSuggestions(newValue);
    setShowSuggestions(true);
  };

  const handleSelect = (suggestion) => {
    onChange(suggestion);
    setShowSuggestions(false);
  };

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        onFocus={handleFocus}
        placeholder={placeholder}
        className="w-full bg-zinc-700 border border-zinc-600 rounded px-2 py-1 text-white text-sm pr-6 focus:border-blue-500 focus:outline-none"
      />
      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />

      {showSuggestions && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-zinc-800 border border-zinc-600 rounded-lg shadow-lg max-h-48 overflow-y-auto custom-scroll"
        >
          {loading ? (
            <div className="px-3 py-2 text-sm text-gray-400 text-center">Loading...</div>
          ) : suggestions.length > 0 ? (
            suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSelect(suggestion)}
                className="w-full text-left px-3 py-2 text-sm text-white hover:bg-zinc-700 transition-colors"
              >
                {suggestion}
              </button>
            ))
          ) : (
            <div className="px-3 py-2 text-sm text-gray-400 text-center">
              {value ? "No suggestions found" : "Start typing"}
            </div>
          )}
        </div>
      )}
    </div>
  );
}