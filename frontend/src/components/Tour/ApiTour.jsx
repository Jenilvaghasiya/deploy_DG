// src/components/ApiTour.jsx
import { tourService } from "@/service/tourService";
import React, { useState, useEffect } from "react";
import Joyride, { STATUS } from "react-joyride";

const ApiTour = ({ tourName, steps, options = {} }) => {
  const [run, setRun] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAndStartTour();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tourName]);

  const checkAndStartTour = async () => {
    try {
      setLoading(true);

      // ✅ pass tourName so service returns boolean for that field
      const hasCompleted = await tourService.checkTourStatus(tourName);

      if (!hasCompleted && steps?.length > 0) {
        setTimeout(() => setRun(true), 800);
      }
    } catch (error) {
      console.error("Error checking tour status:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoyrideCallback = async (data) => {
    const { status } = data;

    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      try {
        await tourService.completeTour(tourName);
      } catch (error) {
        console.error("Error marking tour as complete:", error);
      } finally {
        setRun(false);
      }
    }
  };

  if (loading || !steps?.length) return null;

  const defaultOptions = {
    continuous: true,
    showProgress: true,
    showSkipButton: true,
    disableOverlayClose: false,
    spotlightClicks: true,
    scrollToFirstStep: true,
    disableScrolling: false,
    disableScrollParentFix: true, // Changed to true
    scrollOffset: 100,
    floaterProps: {
      disableAnimation: true, // Add this to prevent animation issues
    }, // Add this for better positioning
    styles: {
      options: {
        primaryColor: "#ec4899",
        zIndex: 10000,
      },
      spotlight: {
        backgroundColor: "rgba(0.5, 0, 0, 0.5)",
        borderRadius: 4,
      },
      overlay: {
        backgroundColor: "rgba(0, 0, 0, 0.62)", // This controls the overlay darkness
      },
      tooltipContainer: {
        textAlign: "left",
      },
      tooltip: {
        borderRadius: 8,
      },
    },
    locale: {
      back: "Back",
      close: "Close",
      last: "Finish Tour",
      next: "Next",
      skip: "Skip Tour",
    },
  };

  return (
    <Joyride
      steps={steps}
      run={run}
      callback={handleJoyrideCallback}
      {...defaultOptions}
      {...options}
    />
  );
};

export default ApiTour;
