import { useState } from "react"
import { Button } from "@/components/ui/button"
import { BsLightning } from "react-icons/bs"
import { updateGeneratedImageStatus } from "@/features/imageGeneration/imageGeneration"
import { useNavigate } from "react-router-dom"
import CombineImage from '../../assets/images/combine_image.png';
import ImageVariation from '../../assets/images/image_variations_white.png';
import { FaImage } from "react-icons/fa"

export default function UseImageModalButton({ aiTaskId, imageUrl }) {
  const [loadingOption, setLoadingOption] = useState(null)
  const navigate = useNavigate()

  const handleOptionClick = async (option) => {
    setLoadingOption(option)
    try {
      const response = await updateGeneratedImageStatus({
        aiTaskId,
        newStatus: "saved",
        imageUrl,
      })

      if (response.status === 200) {
        const updatedImages = response?.data?.data
        if (Array.isArray(updatedImages) && updatedImages.length > 0) {
          const updatedImageID = updatedImages[0].id
          navigate(`/${option}?galleryImageID=${updatedImageID}`)
        }
      }
    } catch (error) {
      console.error("Failed to update image status:", error)
    } finally {
      setLoadingOption(null)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-center w-full bg-violet-500 text-white p-1.5 rounded" disabled>
        <BsLightning size={14} />
        <span className="ml-1">Use This Image For</span>
      </div>

      <div className="flex flex-col gap-2">
        <Button
          variant="secondary"
          className="bg-zinc-800 text-white hover:bg-zinc-700 justify-start "
          onClick={() => handleOptionClick("variation-generation")}
          disabled={loadingOption === "variation-generation"}
        >
          <img src={ImageVariation} alt="Variation Icon" className="w-5 h-5" />
          {loadingOption === "variation-generation" ? "Loading..." : "Variation"}
        </Button>

        <Button
          variant="secondary"
          className="bg-zinc-800 text-white hover:bg-zinc-700  justify-start "
          onClick={() => handleOptionClick("combine-image")}
          disabled={loadingOption === "combine-image"}
        >
          <img src={CombineImage} alt="Combine Icon" className="w-5 h-5" />
          {loadingOption === "combine-image" ? "Loading..." : "Combine Images"}
        </Button>

        <Button
          variant="secondary"
          className="bg-zinc-800 text-white hover:bg-zinc-700 justify-start ml-2"
          onClick={() => handleOptionClick("size-chart-image")}
          disabled={loadingOption === "size-chart-image"}
        >
          <FaImage />
          {loadingOption === "size-chart-image" ? "Loading..." : "Size Chart"}
        </Button>
      </div>
    </div>
  )
}