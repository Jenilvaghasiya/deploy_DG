import React, { useState, useRef, useEffect } from "react"; 
import api from "@/api/axios";
import { AiOutlineTag } from "react-icons/ai";
import { cn } from "@/lib/utils";

export default function TagsInput({ value = "", onChange, onFocus, className, inputClass, placeholder = "Add tag", ...props }) { 
  const [tags, setTags] = useState([]); 
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionTimeout, setSuggestionTimeout] = useState(null);
  const [inputValue, setInputValue] = useState("");
  const maxTags = 10; 
  const inputRef = useRef(null); 

  // Initialize tags from comma-separated value prop
  useEffect(() => {
    if (value) {
      const tagsArray = value.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
      setTags(tagsArray);
    } else {
      setTags([]);
    }
  }, [value]);

  // Fetch tag suggestions when input changes
  useEffect(() => {
    const fetchTags = async () => {
      if (!inputValue || inputValue.trim() === "") {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      try {
        const response = await api.get(`/moodboards/tags`, {
          params: { search: inputValue.trim() },
        });
        setSuggestions(response.data.data || []);
        
        // Show suggestions when user starts typing
        setShowSuggestions(true);
        
        // Clear existing timeout
        if (suggestionTimeout) {
          clearTimeout(suggestionTimeout);
        }
        
        // Set new timeout to hide suggestions after 15-20 seconds
        const newTimeout = setTimeout(() => {
          setShowSuggestions(false);
          setSuggestions([]);
        }, 17000); // 17 seconds (between 15-20)
        
        setSuggestionTimeout(newTimeout);
        
      } catch (error) {
        console.error("Failed to fetch tags:", error);
        setSuggestions([]);
      }
    };

    fetchTags();
    
    // Cleanup timeout on unmount
    return () => {
      if (suggestionTimeout) {
        clearTimeout(suggestionTimeout);
      }
    };
  }, [inputValue]);

  // Update parent component when tags change
  const updateParent = (newTags) => {
    const commaSeparatedValue = newTags.join(',');
    if (onChange) {
      // Create a mock event object similar to input onChange
      const mockEvent = {
        target: {
          value: commaSeparatedValue
        }
      };
      onChange(mockEvent);
    }
  };

  const addTag = (e) => { 
    if (e.key === "Enter" || e.key === ",") { 
      e.preventDefault(); 
      const input = e.target.value.trim().replace(/,/g, ""); 
      if (input.length > 1 && !tags.includes(input)) { 
        if (tags.length < maxTags) { 
          const newTags = [...tags, input];
          setTags(newTags);
          updateParent(newTags);
        } 
      } 
      e.target.value = ""; 
      setInputValue(""); // Clear input value state
    } 
  }; 

  const removeTag = (tagToRemove) => { 
    const newTags = tags.filter((tag) => tag !== tagToRemove);
    setTags(newTags);
    updateParent(newTags);
  }; 

  const handleFocus = () => {
    if (onFocus) {
      onFocus();
    }
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  const handleSuggestionSelect = (selectedTag) => {
    // Add the selected tag to the tags array
    const newTags = [...tags, selectedTag];
    setTags(newTags);
    updateParent(newTags);
    
    // Clear input
    setInputValue("");
    if (inputRef.current) {
      inputRef.current.value = "";
    }
    
    // Hide suggestions after selection
    setShowSuggestions(false);
    setSuggestions([]);
    
    // Clear timeout
    if (suggestionTimeout) {
      clearTimeout(suggestionTimeout);
    }
  };

  return ( 
    <>
        <input type="text" spellCheck="false" onKeyUp={addTag} onChange={handleInputChange} onFocus={handleFocus} ref={inputRef}  placeholder={placeholder}  className={cn("flex-1 px-2 outline-none text-sm p-2 py-1 border border-gray-600 rounded-sm bg-transparent text-zinc-200 placeholder:text-zinc-400", inputClass)}  {...props} /> 
        <div className="relative w-full">
            <ul className={`flex flex-wrap w-full overflow-auto max-h-20 custom-scroll`}> 
                {tags.map((tag) => ( 
                <li 
                    key={tag} 
                    className="flex items-center m-1 border border-purple-500 text-purple-500 px-2 py-0.5 rounded-md text-sm cursor-default bg-transparent hover:bg-purple-500 hover:text-white transition-colors" 
                > 
                    {tag} 
                    <span 
                    onClick={() => removeTag(tag)} 
                    className="ml-2 text-xs w-5 h-5 flex items-center justify-center rounded-full bg-purple-500 text-white cursor-pointer hover:bg-purple-600" 
                    > 
                    × 
                    </span> 
                </li> 
                ))} 
            </ul>      
            {/* Tag Suggestions */}
            {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-0 left-0 -mt-1 bg-gray-800 border border-gray-600 rounded-md p-2 w-full">
                <div className="w-full">
                    <h3 className="text-sm font-medium text-zinc-300 flex items-center mb-2">
                    <AiOutlineTag className="mr-1" /> Suggestions
                    </h3>
                    <div className="flex flex-wrap gap-2 overflow-auto max-h-24 custom-scroll">
                    {suggestions.map((tag, index) => (
                        <span
                        key={index}
                        onClick={() => handleSuggestionSelect(tag)}
                        className="border border-solid border-purple-500 px-2 py-0.5 rounded-md text-sm text-purple-500 cursor-pointer hover:bg-purple-500 hover:text-white transition-colors"
                        >
                        {tag}
                        </span>
                    ))}
                    </div>
                </div>
                </div>
            )}
        </div>
    </>
  ); 
}