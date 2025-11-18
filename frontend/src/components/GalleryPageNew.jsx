import { useState, useEffect } from "react";
import {
    BsGrid,
    BsList,
} from "react-icons/bs";
import api from "../api/axios.js";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

const BASE_URL = import.meta.env.VITE_SERVER_URL;

// Tab options
const TABS = {
    FINALIZED: "finalized",
    SAVED: "saved",
    GENERATED: "generated",
    UPLOADED: "uploaded",
};

export default function GalleryDialog() {
    const [viewMode, setViewMode] = useState("grid");
    const [activeTab, setActiveTab] = useState(TABS.UPLOADED);
    const [galleryImages, setGalleryImages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [contextMenu, setContextMenu] = useState({
        visible: false,
        x: 0,
        y: 0,
        imageId: null,
    });
    const [open, setOpen] = useState(false);

    // Fetch gallery images
    useEffect(() => {
        const fetchGalleryImages = async () => {
            try {
                setLoading(true);
                const response = await api.get("/gallery");
                setGalleryImages(
                    response.data.data.map((img) => ({
                        id: img.id,
                        url: `${BASE_URL}/${img.url}`,
                        name: img.name,
                        status: img.status || "uploaded", // Default status if none is set
                    }))
                );
                setLoading(false);
            } catch (err) {
                setError(
                    err.response?.data?.message ||
                        "Failed to fetch gallery images"
                );
                setLoading(false);
            }
        };

        // Only fetch when dialog is opened
        if (open) {
            fetchGalleryImages();
        }

        // Cleanup previews
        return () => {
            galleryImages.forEach((img) => {
                if (img.preview) {
                    URL.revokeObjectURL(img.preview);
                }
            });
        };
    }, [open]);

    // Close context menu on click outside
    useEffect(() => {
        const handleClickOutside = () => {
            if (contextMenu.visible) {
                setContextMenu({ ...contextMenu, visible: false });
            }
        };

        document.addEventListener("click", handleClickOutside);

        return () => {
            document.removeEventListener("click", handleClickOutside);
        };
    }, [contextMenu]);

    // Handle context menu
    const handleContextMenu = (e, imageId) => {
        e.preventDefault();
        setContextMenu({
            visible: true,
            x: e.clientX,
            y: e.clientY,
            imageId,
        });
    };

    // Filter images based on active tab
    const filteredImages = galleryImages.filter((img) => {
        switch (activeTab) {
            case TABS.FINALIZED:
                return img.status === "finalized";
            case TABS.SAVED:
                return img.status === "saved";
            case TABS.GENERATED:
                return img.status === "generated";
            case TABS.UPLOADED:
            default:
                return img.status === "uploaded";
        }
    });

    // Tab Component
    const TabSelector = () => (
        <div className="flex border-b border-zinc-700 mb-4">
            <button
                className={`px-4 py-2 text-sm font-medium ${
                    activeTab === TABS.UPLOADED
                        ? "border-b-2 border-pink-500 text-pink-400"
                        : "text-white hover:text-pink-400"
                }`}
                onClick={() => setActiveTab(TABS.UPLOADED)}
            >
                Uploaded Images
            </button>
            <button
                className={`px-4 py-2 text-sm font-medium ${
                    activeTab === TABS.GENERATED
                        ? "border-b-2 border-pink-500 text-pink-400"
                        : "text-white hover:text-pink-400"
                }`}
                onClick={() => setActiveTab(TABS.GENERATED)}
            >
                Generated
            </button>
            <button
                className={`px-4 py-2 text-sm font-medium ${
                    activeTab === TABS.SAVED
                        ? "border-b-2 border-pink-500 text-pink-400"
                        : "text-white hover:text-pink-400"
                }`}
                onClick={() => setActiveTab(TABS.SAVED)}
            >
                Saved for Later
            </button>
            <button
                className={`px-4 py-2 text-sm font-medium ${
                    activeTab === TABS.FINALIZED
                        ? "border-b-2 border-pink-500 text-pink-400"
                        : "text-white hover:text-pink-400"
                }`}
                onClick={() => setActiveTab(TABS.FINALIZED)}
            >
                Finalized
            </button>
        </div>
    );

    // Grid View Component
    const GridView = () => (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {/* Gallery Items */}
            {filteredImages.map((image) => (
                <div
                    key={image.id}
                    className="relative aspect-square border-shadow-blur rounded-xl overflow-hidden group"
                    onContextMenu={(e) => handleContextMenu(e, image.id)}
                >
                    <img
                        src={image.url}
                        alt={image.name}
                        className="w-full h-full object-cover"
                    />                
                </div>
            ))}
        </div>
    );

    // List View Component
    const ListView = () => (
        <div className="space-y-3 p-4">
            {/* Gallery Items */}
            {filteredImages.map((image) => (
                <div
                    key={image.id}
                    className="flex bg-zinc-900 rounded-lg overflow-hidden"
                    onContextMenu={(e) => handleContextMenu(e, image.id)}
                >
                    <div className="w-24 h-24 bg-zinc-800 overflow-hidden relative">
                        <img
                            src={image.url}
                            alt={image.name}
                            className="w-full h-full object-cover"
                        />                        
                    </div>
                </div>
            ))}
        </div>
    );

    const GalleryContent = () => {
        if (loading) {
            return <div className="text-center text-zinc-400 py-8">Loading...</div>;
        }

        return (
            <div className="space-y-4">
                {/* Tabs */}
                <TabSelector />

                <div className="flex justify-between items-center">
                    <div className="flex items-center bg-zinc-800 rounded-full p-1">
                        <button
                            className={`flex items-center px-3 py-1 rounded-full ${
                                viewMode === "list"
                                    ? "bg-zinc-700 text-white"
                                    : "text-zinc-400 hover:text-white"
                            }`}
                            onClick={() => setViewMode("list")}
                        >
                            <BsList size={16} className="mr-2" />
                            List
                        </button>
                        <button
                            className={`flex items-center px-3 py-1 rounded-full ${
                                viewMode === "grid"
                                    ? "bg-zinc-700 text-white"
                                    : "text-zinc-400 hover:text-white"
                            }`}
                            onClick={() => setViewMode("grid")}
                        >
                            <BsGrid size={16} className="mr-2" />
                            Grid
                        </button>
                    </div>
                </div>

                {error && <div className="text-red-500 mb-4">{error}</div>}

                {/* Display view */}
                <div className="max-h-96 overflow-y-auto">
                    {viewMode === "grid" ? <GridView /> : <ListView />}
                </div>
            </div>
        );
    };
}