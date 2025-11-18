import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { fetchStrapiContent } from "../utils/axiosUtils";
import ReactMarkdown from "react-markdown";

export default function BlogDetail() {
  const { slug } = useParams();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        const res = await fetchStrapiContent(`blogs?filters[slug][$eq]=${slug}&populate=coverImage`);
        if (res && res.length > 0) {
          setBlog(res[0]);
        } else {
          setError("Blog not found.");
        }
      } catch (err) {
        setError("Failed to load blog.");
      } finally {
        setLoading(false);
      }
    };

    fetchBlog();
  }, [slug]);

  if (loading) return <div className="text-white p-8">Loading...</div>;
  if (error) return <div className="text-red-500 p-8">{error}</div>;

  return (
    <div className="text-white p-8 max-w-4xl mx-auto pt-32">
      <h1 className="text-3xl font-bold mb-4">{blog.title}</h1>
      {blog.coverImage?.url && (
        <img
          src={`${import.meta.env.VITE_STRAPI_URL.replace(/\/$/, "")}${blog.coverImage.url}`}
          alt={blog.title}
          className="w-full h-auto mb-6 rounded-lg"
        />
      )}
      <div className="text-lg text-gray-300 whitespace-pre-line">
         <ReactMarkdown>{blog.content}</ReactMarkdown>
      </div>
    </div>
  );
}
