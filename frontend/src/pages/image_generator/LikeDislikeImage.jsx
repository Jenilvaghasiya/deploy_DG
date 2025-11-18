import React, { useCallback, useEffect } from "react";
import api from "../../api/axios";
import { BsHandThumbsDown, BsHandThumbsUp } from "react-icons/bs";

const LikeDislikeImage = ({ variation,setImageFeedback,imageFeedback,setUpdatedImageUrls }) => {
    

    const handleLikeDislike = async (imageId, like) => {
		console.log("Like/Dislike clicked", imageId, like);
		try {
			const currentStatus = imageFeedback[variation];
			let newStatus = like ? "liked" : "disliked";

			// If the same action is clicked again, toggle to "none"
			if ((like && currentStatus === "liked") || (!like && currentStatus === "disliked")) {
				newStatus = "none";
			}

			const response = await api.put(`/gallery/generated-feedback`, {
				image_url: variation,
				status: newStatus,
			});
      
      if(response.status === 200 && like){
        setUpdatedImageUrls((prev) => new Set(prev).add(variation));
      }


			getGeneratedImageFeedback();
		} catch (err) {
			// onError(err.response?.data?.message || "Failed to update image feedback");
            console.log(err,'err')
		}
	};

    const getGeneratedImageFeedback = useCallback(async () => {
		try {
			const response = await api.get("/gallery/generated-feedback");
			if(response.data.data){
				const feedbackMap = response.data.data.reduce((acc, item) => {
					acc[item.image_url] = item.status;
					return acc;
				}, {});
				setImageFeedback(feedbackMap);
			}
			console.log("Fetched generated image feedback:", response.data.data);
			return response.data.data;
		} catch (err) {
            console.log(err, 'err')
			// onError(err.response?.data?.message || "Failed to fetch image feedback");
		}
	}, []);

    useEffect(()=>{
        getGeneratedImageFeedback()
    },[getGeneratedImageFeedback])

  return (
    <>
      <button
        onClick={() => handleLikeDislike(variation, true)}
        className={`flex items-center justify-center p-1.5 rounded  w-5/12 grow ${
          imageFeedback[variation] === "liked"
            ? "bg-pink-600 text-white"
            : "bg-zinc-700 text-white hover:bg-zinc-600"
        }`}
        title="Like"
      >
        <BsHandThumbsUp size={14} />
        <span className="ml-1">Like</span>
      </button>

      <button
        onClick={() => handleLikeDislike(variation, false)}
        className={`flex items-center justify-center p-1.5 rounded w-5/12 grow ${
          imageFeedback[variation] === "disliked"
            ? "bg-red-600 text-white"
            : "bg-zinc-700 text-white hover:bg-zinc-600"
        }`}
        title="Dislike"
      >
        <BsHandThumbsDown size={14} />
        <span className="ml-1">Dislike</span>
      </button>
         {/* <span className="text-[10px] text-black italic">
        * Liked images will automatically move to the Save for Later section.
      </span> */}
    </>
  );
};

export default LikeDislikeImage;
