// components/landing/HowItWorksSection.jsx
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Play,
  Palette,
  Layout,
  FolderOpen,
  Sparkles,
  ArrowRight,
  Clock,
  X,
  BookOpen,
  Rocket,
  Settings,
  CheckCircle,
  Youtube,
  AlertCircle,
  PlayCircle,
  ChevronLeft,
  ChevronRight,
  VideoOff,
  Info,
} from "lucide-react";
import React from "react";
import { Link } from "react-router-dom";

const HowItWorksSection = () => {
  const [allTours, setAllTours] = useState([]);
  const [activeTour, setActiveTour] = useState("0");
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [currentVideo, setCurrentVideo] = useState(null);
  const [currentVideoTitle, setCurrentVideoTitle] = useState("");
  const [videoType, setVideoType] = useState("file"); // 'file' or 'youtube'
  const [selectedStep, setSelectedStep] = useState(null);
  const [selectedStepVideo, setSelectedStepVideo] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showNoVideoAlert, setShowNoVideoAlert] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  
  const STEPS_PER_PAGE = 3;

  useEffect(() => {
    fetchHowItWorksData();
  }, []);

  // Helper function to truncate title
  const getTruncatedTitle = (title) => {
    if (!title) return "";
    const words = title.split(" ");
    if (words.length <= 1) return title;
    return `${words[0]}...`;
  };

  // Helper function to get icon based on category
  const getCategoryIcon = (category) => {
    const iconMap = {
      "Getting Started": Rocket,
      "Gallery": Palette,
      "Moodboard": Layout,
      "Projects": FolderOpen,
      "Advanced": Settings,
    };
    return iconMap[category] || BookOpen;
  };

  // Helper function to get color based on index or category
  const getCategoryColor = (category, index) => {
    const colorMap = {
      "Getting Started": "from-purple-500 to-pink-500",
      "Gallery": "from-blue-500 to-cyan-500",
      "Moodboard": "from-green-500 to-emerald-500",
      "Projects": "from-orange-500 to-red-500",
      "Advanced": "from-indigo-500 to-purple-500",
    };
    
    const defaultColors = [
      "from-purple-500 to-pink-500",
      "from-blue-500 to-cyan-500",
      "from-green-500 to-emerald-500",
      "from-orange-500 to-red-500",
    ];
    
    return colorMap[category] || defaultColors[index % defaultColors.length];
  };

  // Extract YouTube video ID from URL
  const extractYouTubeVideoId = (url) => {
    if (!url) return null;
    
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /^([^&\n?#]+)$/ // Just the video ID
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    
    return null;
  };

  // Get YouTube embed URL
  const getYouTubeEmbedUrl = (url) => {
    const videoId = extractYouTubeVideoId(url);
    return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=0` : null;
  };

  // Check if URL is YouTube
  const isYouTubeUrl = (url) => {
    if (!url) return false;
    return url.includes('youtube.com') || url.includes('youtu.be') || /^[a-zA-Z0-9_-]{11}$/.test(url);
  };

  // Handle step click
  const handleStepClick = (step) => {
    setSelectedStep(step);
    
    if (!step.videoURL) {
      setSelectedStepVideo(null);
      setShowNoVideoAlert(true);
      setTimeout(() => setShowNoVideoAlert(false), 3000);
      return;
    }
    
    setShowNoVideoAlert(false);
    
    if (isYouTubeUrl(step.videoURL)) {
      setSelectedStepVideo(getYouTubeEmbedUrl(step.videoURL));
    } else {
      // Handle regular video URL
      if (step.videoURL.startsWith('/')) {
        setSelectedStepVideo(`${import.meta.env.VITE_STRAPI_LOCAL_URL}${step.videoURL}`);
      } else {
        setSelectedStepVideo(step.videoURL);
      }
    }
  };

  // Get steps for tour (no default steps)
  const getStepsForTour = (tour) => {
    if (tour.Steps && tour.Steps.length > 0) {
      // Sort steps by StepNumber if available
      return tour.Steps.sort((a, b) => {
        const aNum = a.StepNumber || 999;
        const bNum = b.StepNumber || 999;
        return aNum - bNum;
      });
    }
    return [];
  };

  const fetchHowItWorksData = async () => {
    setIsLoading(true);
    setHasError(false);
    
    try {
      const response = await fetch(
        `${import.meta.env.VITE_STRAPI_LOCAL_URL}/api/howworks?populate=*`
      );
      const data = await response.json();
      console.log("Fetched tours:", data);
      
      if (data.data && data.data.length > 0) {
        // Filter only active tours (treat null as active)
        const activeTours = data.data.filter(tour => 
          tour.isActive === true || tour.isActive === null
        );
        
        // Add default values for null fields
        const toursWithDefaults = activeTours.map((tour, index) => ({
          ...tour,
          Title: tour.Title || `Tour ${index + 1}`,
          Description: tour.Description || "Learn how to use this feature effectively",
          Category: tour.Category || "Getting Started",
          EstimatedTime: tour.EstimatedTime || 5,
          Steps: tour.Steps || [],
          YoutubeUrl: tour.YoutubeUrl || null,
          Order: tour.Order !== null && tour.Order !== undefined ? tour.Order : 999,
        }));
        
        // Sort tours by Order field (ascending)
        const sortedTours = toursWithDefaults.sort((a, b) => {
          if (a.Order !== 999 || b.Order !== 999) {
            return a.Order - b.Order;
          }
          return 0;
        });
        
        setAllTours(sortedTours);
        
        // Auto-select first step's video if available
        if (sortedTours.length > 0 && sortedTours[0].Steps?.length > 0) {
          const firstStepWithVideo = sortedTours[0].Steps.find(step => step.videoURL);
          if (firstStepWithVideo) {
            handleStepClick(firstStepWithVideo);
          }
        }
      } else {
        // No data from Strapi - keep empty
        console.log("No data from Strapi");
        setAllTours([]);
      }
    } catch (error) {
      console.error("Error fetching how it works data:", error);
      setHasError(true);
      setAllTours([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Pagination helpers
  const getPaginatedSteps = (steps) => {
    const startIndex = (currentPage - 1) * STEPS_PER_PAGE;
    const endIndex = startIndex + STEPS_PER_PAGE;
    return steps.slice(startIndex, endIndex);
  };

  const getTotalPages = (steps) => {
    return Math.ceil(steps.length / STEPS_PER_PAGE);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Reset selected step video and pagination when changing tabs
  useEffect(() => {
    setSelectedStep(null);
    setSelectedStepVideo(null);
    setCurrentPage(1);
    setShowNoVideoAlert(false);
    
    // Auto-select first step with video in new tab
    const currentTour = allTours[parseInt(activeTour)];
    if (currentTour?.Steps?.length > 0) {
      const firstStepWithVideo = currentTour.Steps.find(step => step.videoURL);
      if (firstStepWithVideo) {
        handleStepClick(firstStepWithVideo);
      }
    }
  }, [activeTour, allTours]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="pb-8 min-h-screen bg-black text-white flex flex-col overflow-hidden relative dg-footer before:size-56 lg:before:size-80 xl:before:size-96 before:bg-no-repeat before:bg-cover before:absolute before:-top-56 before:-right-28 xl:before:right-10 after:size-56 lg:after:size-80 xl:after:size-96 after:bg-no-repeat after:bg-cover after:absolute after:-bottom-72 after:-left-20 bg-purple-vectore">
        <div className="overflow-auto custom-scroll flex flex-col h-96 grow relative z-10">
          <div className="md:min-h-64 w-full relative border-shadow-blur pt-32 pb-10 lg:pb-16 mb-10 border-b border-solid border-white/30">
            <div className="container px-4 mx-auto text-center">
              <h1 className="text-2xl xl:text-3xl 2xl:text-4xl font-bold text-center mb-2">
                How It Works
              </h1>
              <p className="text-base text-white max-w-4xl w-full mx-auto">
                Loading comprehensive guides...
              </p>
              {/* Loading skeleton */}
              <div className="mt-8 flex justify-center space-x-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-10 w-32 bg-white/10 rounded-lg"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show empty state when no tours available
  if (!isLoading && allTours.length === 0) {
    return (
      <div className="pb-8 min-h-screen bg-black text-white flex flex-col overflow-hidden relative dg-footer before:size-56 lg:before:size-80 xl:before:size-96 before:bg-no-repeat before:bg-cover before:absolute before:-top-56 before:-right-28 xl:before:right-10 after:size-56 lg:after:size-80 xl:after:size-96 after:bg-no-repeat after:bg-cover after:absolute after:-bottom-72 after:-left-20 bg-purple-vectore">
        <div className="overflow-auto custom-scroll flex flex-col h-96 grow relative z-10">
          <div className="md:min-h-64 w-full relative border-shadow-blur pt-32 pb-10 lg:pb-16 mb-10 border-b border-solid border-white/30">
            <div className="container px-4 mx-auto text-center">
              <h1 className="text-2xl xl:text-3xl 2xl:text-4xl font-bold text-center mb-2">
                How It Works
              </h1>
              <p className="text-base text-white max-w-4xl w-full mx-auto mb-8">
                Learn how to use Design Genie with our comprehensive guides.
              </p>
              
              {/* Empty State Content */}
              <div className="max-w-md mx-auto mt-12">
                <Card className="bg-white/5 border-white/10">
                  <CardContent className="p-8 text-center">
                    {hasError ? (
                      <>
                        <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-white mb-2">Unable to Load Guides</h3>
                        <p className="text-gray-400 mb-6">
                          We're having trouble loading the guides. Please try again later.
                        </p>
                        <Button onClick={() => fetchHowItWorksData()} variant="secondary">
                          Try Again
                        </Button>
                      </>
                    ) : (
                      <>
                        <BookOpen className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-white mb-2">No Guides Available</h3>
                        <p className="text-gray-400 mb-6">
                          Guides and tutorials will appear here once they are published.
                        </p>
                        <Link to="/onboarding">
                          <Button variant="secondary">
                            Get Started Anyway
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </Link>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main content with tours
  return (
    <>
      <div className="pb-8 min-h-screen bg-black text-white flex flex-col overflow-hidden relative dg-footer before:size-56 lg:before:size-80 xl:before:size-96 before:bg-no-repeat before:bg-cover before:absolute before:-top-56 before:-right-28 xl:before:right-10 after:size-56 lg:after:size-80 xl:after:size-96 after:bg-no-repeat after:bg-cover after:absolute after:-bottom-72 after:-left-20 bg-purple-vectore">
        <div className="overflow-auto custom-scroll flex flex-col h-96 grow relative z-10">
          {/* Header Section */}
          <div className="md:min-h-64 w-full relative border-shadow-blur pt-32 pb-10 lg:pb-16 mb-10 border-b border-solid border-white/30">
            <div className="container px-4 mx-auto text-center">
              <h1 className="text-2xl xl:text-3xl 2xl:text-4xl font-bold text-center mb-2">
                How It Works
              </h1>
              <p className="text-base text-white max-w-4xl w-full mx-auto">
                Design Genie with our comprehensive guides. Click on any step to view its video tutorial.
              </p>
            </div>
          </div>

          {/* Main Content */}
          <div className="container mx-auto px-4">
            {/* Tours Tabs */}
            <TooltipProvider>
              <Tabs value={activeTour} onValueChange={setActiveTour} className="w-full max-w-7xl mx-auto">
                <TabsList className="flex flex-wrap gap-2 bg-white/5 p-2 h-auto justify-start cursor-pointer">
                  {allTours.map((tour, index) => {
                    const Icon = getCategoryIcon(tour.Category);
                    const isActive = activeTour === index.toString();
                    const truncatedTitle = getTruncatedTitle(tour.Title);
                    const needsTruncation = tour.Title.split(" ").length > 1;
                    
                    return (
                      <Tooltip key={index}>
                        <TooltipTrigger asChild>
                          <TabsTrigger
                            value={index.toString()}
                            className={`
                              flex items-center gap-2 relative transition-all duration-300 cursor-pointer
                              data-[state=active]:bg-gradient-to-r data-[state=active]:${getCategoryColor(tour.Category, index)}
                              data-[state=active]:text-white data-[state=active]:shadow-lg
                              text-gray-300 hover:text-white hover:bg-white/10
                              ${isActive ? 'ring-2 ring-white/30 ring-offset-2 ring-offset-black' : ''}
                            `}
                          >
                            <Icon className={`w-4 h-4 ${isActive ? 'animate-pulse' : ''}`} />
                            <span className="text-sm">{truncatedTitle}</span>
                            {tour.Order !== 999 && (
                              <span className="text-xs opacity-60">#{tour.Order}</span>
                            )}
                            {isActive && (
                              <motion.div
                                layoutId="activeTab"
                                className="absolute inset-0 bg-gradient-to-r opacity-20 rounded-md"
                                initial={false}
                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                              />
                            )}
                          </TabsTrigger>
                        </TooltipTrigger>
                        {needsTruncation && (
                          <TooltipContent side="bottom" className="bg-gray-900 text-white border-gray-700">
                            <p>{tour.Title}</p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    );
                  })}
                </TabsList>

                {allTours.map((tour, tourIndex) => {
                  const steps = getStepsForTour(tour);
                  const paginatedSteps = getPaginatedSteps(steps);
                  const totalPages = getTotalPages(steps);
                  
                  return (
                    <TabsContent key={tourIndex} value={tourIndex.toString()} className="mt-8">
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                      >
                        {/* Tour Header */}
                        <div className="mb-8">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                            <div>
                              <div className="flex items-center gap-3 mb-2">
                                <div className={`p-2 rounded-lg bg-gradient-to-r ${getCategoryColor(tour.Category, tourIndex)}`}>
                                  {React.createElement(getCategoryIcon(tour.Category), { className: "w-5 h-5" })}
                                </div>
                                <h2 className="text-2xl md:text-3xl font-bold">{tour.Title}</h2>
                              </div>
                              <p className="text-gray-300 max-w-3xl">{tour.Description}</p>
                            </div>
                          </div>
                        </div>

                        {/* Tour Content Grid */}
                        <div className="grid lg:grid-cols-2 gap-8 mb-12">
                          {/* Steps Section */}
                          <div>
                            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                              <CheckCircle className="w-5 h-5 text-green-500" />
                              Steps to Follow
                            </h3>
                            {steps.length > 0 ? (
                              <>
                                <div className="space-y-4 min-h-auto">
                                  {paginatedSteps.map((step, stepIndex) => {
                                    const actualIndex = (currentPage - 1) * STEPS_PER_PAGE + stepIndex;
                                    const hasVideo = !!step.videoURL;
                                    
                                    return (
                                      <motion.div
                                        key={step.StepNumber}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.3, delay: stepIndex * 0.1 }}
                                        onClick={() => handleStepClick(step)}
                                        className={`cursor-pointer ${hasVideo ? 'hover:scale-[1.02]' : 'hover:scale-[1.01]'} transition-transform`}
                                      >
                                        <Card className={`
                                          bg-white/5 border-white/10 transition-all
                                          ${selectedStep?.StepNumber === step.StepNumber ? 'ring-2 ring-purple-500 bg-white/10' : 'hover:bg-white/10'}
                                          ${!hasVideo ? 'border-dashed' : ''}
                                        `}>
                                          <CardContent className="p-4">
                                            <div className="flex gap-4">
                                              <div className={`w-10 h-10 rounded-full ${
                                                hasVideo 
                                                  ? `bg-gradient-to-br ${getCategoryColor(tour.Category, actualIndex)}`
                                                  : 'bg-gray-700'
                                              } flex items-center justify-center flex-shrink-0 font-bold text-sm`}>
                                                {step.StepNumber}
                                              </div>
                                              <div className="flex-1">
                                                <div className="flex items-center justify-between">
                                                  <h4 className="font-semibold mb-1 text-white">{step.StepTitle}</h4>
                                                  {hasVideo ? (
                                                    <PlayCircle className="w-5 h-5 text-purple-400" />
                                                  ) : (
                                                    <VideoOff className="w-5 h-5 text-gray-500" />
                                                  )}
                                                </div>
                                                <p className="text-sm text-gray-400 leading-relaxed">
                                                  {step.StepDescription}
                                                </p>
                                                {hasVideo ? (
                                                  <p className="text-xs text-purple-400 mt-2">
                                                    Click to view video →
                                                  </p>
                                                ) : (
                                                  <p className="text-xs text-gray-500 mt-2 italic">
                                                    Text guide only (no video)
                                                  </p>
                                                )}
                                              </div>
                                            </div>
                                          </CardContent>
                                        </Card>
                                      </motion.div>
                                    );
                                  })}
                                </div>

                                {/* Pagination Controls */}
                                {totalPages > 1 && (
                                  <div className="flex items-center justify-between mt-6 pt-6 border-t border-white/10">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handlePageChange(currentPage - 1)}
                                      disabled={currentPage === 1}
                                      className="disabled:opacity-50"
                                    >
                                      <ChevronLeft className="w-4 h-4 mr-1" />
                                      Previous
                                    </Button>

                                    <div className="flex items-center gap-2">
                                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                        <button
                                          key={page}
                                          onClick={() => handlePageChange(page)}
                                          className={`
                                            w-8 h-8 rounded-full text-sm font-medium transition-all cursor-pointer
                                            ${currentPage === page 
                                              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' 
                                              : 'bg-white/10 text-gray-400 hover:bg-white/20 hover:text-white'}
                                          `}
                                        >
                                          {page}
                                        </button>
                                      ))}
                                    </div>

                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handlePageChange(currentPage + 1)}
                                      disabled={currentPage === totalPages}
                                      className="disabled:opacity-50"
                                    >
                                      Next
                                      <ChevronRight className="w-4 h-4 ml-1" />
                                    </Button>
                                  </div>
                                )}

                                {/* Page Info */}
                                {totalPages > 1 && (
                                  <div className="text-center mt-4">
                                    <p className="text-xs text-gray-500">
                                      Showing {((currentPage - 1) * STEPS_PER_PAGE) + 1}-
                                      {Math.min(currentPage * STEPS_PER_PAGE, steps.length)} of {steps.length} steps
                                    </p>
                                  </div>
                                )}
                              </>
                            ) : (
                              <Card className="bg-white/5 border-white/10">
                                <CardContent className="p-6 text-center">
                                  <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
                                  <p className="text-gray-400">No steps available for this tour yet.</p>
                                </CardContent>
                              </Card>
                            )}
                          </div>

                          {/* Video Section */}
                          <div>
                            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                              <Youtube className="w-5 h-5 text-red-500" />
                              Video Tutorial
                            </h3>
                            <Card className="bg-white/5 border-white/10 overflow-hidden sticky top-4">
                              <div className="aspect-video relative">
                                {showNoVideoAlert && selectedStep && !selectedStep.videoURL && (
                                  <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 bg-yellow-600/90 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                                  >
                                    <Info className="w-4 h-4" />
                                    <span className="text-sm">No video available for this step</span>
                                  </motion.div>
                                )}
                                
                                {selectedStepVideo ? (
                                  <>
                                    {isYouTubeUrl(selectedStep?.videoURL) ? (
                                      <iframe
                                        width="100%"
                                        height="100%"
                                        src={selectedStepVideo}
                                        title={selectedStep?.StepTitle || "Tutorial Video"}
                                        frameBorder="0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                        allowFullScreen
                                        className="rounded-t-lg"
                                      />
                                    ) : (
                                      <video
                                        width="100%"
                                        height="100%"
                                        controls
                                        className="rounded-t-lg"
                                        src={selectedStepVideo}
                                        key={selectedStepVideo}
                                      >
                                        Your browser does not support the video tag.
                                      </video>
                                    )}
                                  </>
                                ) : (
                                  <div className="w-full h-full bg-gradient-to-br from-purple-600/20 to-pink-600/20 flex items-center justify-center">
                                    <div className="text-center p-6">
                                      {selectedStep && !selectedStep.videoURL ? (
                                        <>
                                          <VideoOff className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                                          <p className="text-white/70 font-medium mb-2">No Video Available</p>
                                          <p className="text-white/50 text-sm">
                                            This step contains text instructions only
                                          </p>
                                        </>
                                      ) : (
                                        <>
                                          <Youtube className="w-16 h-16 text-white/30 mx-auto mb-4" />
                                          <p className="text-white/50">
                                            {steps.some(s => s.videoURL) 
                                              ? "Select a step to view its video tutorial" 
                                              : "No videos available for this tour"}
                                          </p>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                              {selectedStep && (
                                <CardContent className="p-4 bg-white/5">
                                  <div className="flex items-center gap-2 mb-2">
                                    <div className={`w-8 h-8 rounded-full ${
                                      selectedStep.videoURL 
                                        ? `bg-gradient-to-br ${getCategoryColor(tour.Category, selectedStep.StepNumber - 1)}`
                                        : 'bg-gray-700'
                                    } flex items-center justify-center flex-shrink-0 font-bold text-xs`}>
                                      {selectedStep.StepNumber}
                                    </div>
                                    <h4 className="font-semibold text-white">
                                      {selectedStep.StepTitle}
                                    </h4>
                                    {!selectedStep.videoURL && (
                                      <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">
                                        Text Only
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-sm text-gray-400">
                                    {selectedStep.StepDescription}
                                  </p>
                                </CardContent>
                              )}
                            </Card>
                          </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="flex flex-wrap gap-4 justify-center">
                          <Link to="/onboarding">
                            <Button
                              variant="secondary"
                            >
                              Get Started
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                      </motion.div>
                    </TabsContent>
                  );
                })}
              </Tabs>
            </TooltipProvider>

            {/* Help Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="text-center pb-8 mt-16"
            >
              <p className="text-gray-400 mb-4">
                Need more help? Contact support
              </p>
              <div className="flex gap-4 justify-center">
                <Link to="/#contact">
                  <Button
                    variant="link"
                    className="text-purple-400 hover:text-purple-300"
                  >
                    Contact Support
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
};

export default HowItWorksSection;