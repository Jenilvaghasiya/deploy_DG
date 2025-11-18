import SmartImage from "@/components/SmartImage";
import { FaUserCircle } from "react-icons/fa";
import { IoArrowBackCircleOutline } from "react-icons/io5";

export const PostReviewDisplay = ({ posts, onBack }) => {  
  return (
    <>
      {/* Header with back button */}
      <header className="bg-zinc-800 border-b border-zinc-700 p-4 sticky w-full top-0 z-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 cursor-pointer text-zinc-300 hover:text-white"
          >
            <IoArrowBackCircleOutline size={24} />
            <span>Back</span>
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-6 space-y-12">
        {Array.isArray(posts) && posts.length > 0 ? (
          posts.map((post) => {
            const reviews = post.reviews || [];
            return (
              <div key={post._id}>
                {/* Post Owner */}
                <div className="flex gap-2 items-center post-owner-name mb-2">
                  <FaUserCircle size={36} className="text-gray-300" />
                  <h2 className="text-gray-300">
                    {post.user_id?.nick_name || "Unknown"}
                  </h2>
                </div>

                {/* Post Title */}
                <h3 className="text-lg ms-11 font-bold text-white mb-4">
                  {post.title}
                </h3>

                {/* Post Date */}
                {post.created_at && (
                  <p className="text-zinc-400 mb-6 ms-11">
                    Posted on {new Date(post.created_at).toLocaleDateString()}
                  </p>
                )}

                {/* Post Image */}
                {post.url && (
                  <div className="mb-8 flex justify-center">
                    <SmartImage
                      src={post.url}
                      alt={post.title}
                      className="max-w-full rounded-lg"
                    />
                  </div>
                )}

                {/* Post Description */}
                {post.description && (
                  <div className="prose prose-invert max-w-none mb-8">
                    <p className="text-zinc-300 whitespace-pre-wrap">
                      {post.description}
                    </p>
                  </div>
                )}

                {/* Reviews */}
                <section className="mt-6 border-t border-zinc-700 pt-6">
                  <h2 className="text-2xl font-semibold text-white mb-6">
                    Reviews ({reviews.length})
                  </h2>

                  {reviews.length > 0 ? (
                    <div className="space-y-4">
                      {reviews.map((review) => (
                        <div
                          key={review._id}
                          className="bg-zinc-800 p-6 rounded-lg"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <h3 className="font-medium text-zinc-200 text-lg">
                              {review.user_id?.full_name || "Anonymous"}
                            </h3>
                            {review.rating && (
                              <div className="flex text-yellow-400">
                                {[...Array(5)].map((_, i) => (
                                  <span key={i} className="text-xl">
                                    {i < review.rating ? "★" : "☆"}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <p className="text-zinc-300 mb-3">{review.comment}</p>
                          {review.created_at && (
                            <p className="text-zinc-500 text-sm">
                              {new Date(review.created_at).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-zinc-400 text-center py-8">No reviews yet</p>
                  )}
                </section>
              </div>
            );
          })
        ) : (
          <p className="text-zinc-400 text-center py-8">No posts found</p>
        )}
      </div>
    </>
  );
};
