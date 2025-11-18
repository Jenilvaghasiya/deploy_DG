import api from "@/api/axios";
import { useEffect, useState } from "react";
import { AiOutlineTag } from "react-icons/ai";


export default function TagSuggestions({ search, onTagSelect,enabled,onBlur }) {
  const [tags, setTags] = useState([]);

  useEffect(() => {
    const fetchTags = async () => {
      if (!search || search.trim() === "") {
        setTags([]); // Clear tags if search is blank
        return;
      }
      const lastText = search
        .split(',')
        .map(item => item.trim())
        .pop();

      try {
        const response = await api.get(`/moodboards/tags`, {
          params: { search: lastText.trim() },
        });
        setTags(response.data.data || []);
      } catch (error) {
        console.error("Failed to fetch tags:", error);
        setTags([]);
      }
    };

    fetchTags();
  }, [search]);

  if (!enabled || tags.length === 0) return null; // 👈 hide entirely if not focused

  return (
    <>
      {tags.length > 0 && (
        <div className="overflow-auto max-h-24 custom-scroll">
          <h3 className="text-sm font-medium text-zinc-300 flex items-center mb-2">
            <AiOutlineTag className="mr-1" /> Suggetions
          </h3>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag, index) => (
              <span
                key={index}
                onClick={() => {
                  onBlur && onBlur("")
                  onTagSelect && onTagSelect(tag)
                }}
                className="border border-solid border-purple-500 px-2 py-0.5 rounded-md text-sm text-purple-500 cursor-pointer hover:bg-purple-500 hover:text-white transition-colors"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
