import SmartImage from "@/components/SmartImage";
import {Button} from "../../components/ui/button";
import ImagePreviewDialog from "../moodboards/ImagePreviewDialog";
const BASE_API_URL = import.meta.env.VITE_API_URL;

const BASE_URL = import.meta.env.VITE_SERVER_URL;

function UserProjectCard({ project, onEdit, onNavigate,hasEditProjectPermission }) {
	return (
    <div className="flex flex-col bg-white/10 rounded-xl border-shadow-blur overflow-hidden border border-white/35 hover:border-white/40 transition-all shadow-lg">
      <div className="p-3">
        <div className="grid grid-cols-3 gap-2 h-full">
          {[0, 1, 2, 3, 4, 5].map((index) => (
            <div
              key={index}
              className="aspect-square bg-zinc-800 rounded-md overflow-hidden"
            >
              {project.images && index < project.images.length ? (
                <div className="w-full h-full flex items-center justify-center">
                    <ImagePreviewDialog
                    imageUrl={
                        `${BASE_API_URL}/genie-image/${project.images[index].url}`
                      }
                      >
                <div className="cursor-pointer">
                  <SmartImage
                    src={
                      project.images[index].status === "saved"
                        ? `${BASE_API_URL}/genie-image/${project.images[index].url}`
                        : project.images[index].url
                    }
                    alt={`Project Image ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  </div>
                  </ImagePreviewDialog>
                </div>
                
              ) : (
                <div className="w-full h-full flex items-center justify-center text-zinc-700 text-xs">
                  {/* Empty placeholder */}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="p-4 bg-opacity-60 grow flex flex-col border-t border-solid border-white/35">
        <div className="mb-3">
          <h3 className="font-medium text-lg mb-1">
            {project.title || project.name}
          </h3>
          <div className="text-sm text-zinc-400 mb-1">
            Timeline:{" "}
            {project.start_date &&
              new Date(project.start_date).toLocaleDateString()}{" "}
            -{" "}
            {project.end_date &&
              new Date(project.end_date).toLocaleDateString()}
          </div>
          <div className="text-sm text-zinc-400 line-clamp-2 mb-2">
            {project.description}
          </div>
        </div>
        <div className="flex gap-2 mt-auto">
          <Button variant={"secondary"} onClick={() => onNavigate(project.id)}>
            Explore
          </Button>
          {hasEditProjectPermission && (
            <Button variant={"secondary"} onClick={() => onEdit(project.id)}>Edit</Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default UserProjectCard;
