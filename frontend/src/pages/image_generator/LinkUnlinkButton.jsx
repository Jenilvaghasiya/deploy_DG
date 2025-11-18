import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Link as LinkIcon } from "lucide-react";
import api from "@/api/axios";


export default function LinkUnlinkButton({
  connectedTableIDs = [],
  currentTableID,
  sizeChartId, // Pass this from parent
  projectID,    // Pass this from parent
  onSuccess,    // Optional callback if you want to refresh parent state
}) {
  const [loading, setLoading] = useState(false);
  const isConnected = connectedTableIDs.includes(currentTableID);
  console.log("connectedTableIDs",connectedTableIDs,
  currentTableID,
  sizeChartId, // Pass this from parent
  projectID,    // Pass this from parent
  onSuccess, );

  const handleLink = async () => {
    if (!projectID) {
      console.error("No projectID provided");
      return;
    }
    setLoading(true);
    try {
      await api.post(`/gallery/link-project/size-chart/${sizeChartId}`, {
        project_id: projectID,
      });
      onSuccess?.(); // Refresh parent state if needed
    } catch (err) {
      console.error("Failed to link project", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUnlink = async () => {
    setLoading(true);
    try {
      await api.post(`/gallery/unlink-project/size-chart/${sizeChartId}`, {
        project_id: projectID,
      });
      onSuccess?.(); // Refresh parent state if needed
    } catch (err) {
      console.error("Failed to unlink project", err);
    } finally {
      setLoading(false);
    }
  };

  return isConnected ? (
    <Button
      size="sm"
      onClick={handleUnlink}
      variant="destructive"
      disabled={loading}
      className="text-xs"
    >
      {loading ? "Unlinking..." : "Unlink"}
    </Button>
  ) : (
    <Button
      size="sm"
      onClick={handleLink}
      disabled={loading}
      className="text-xs flex items-center"
    >
      {loading ? (
        "Linking..."
      ) : (
        <>
          <LinkIcon className="w-3 h-3 mr-1" />
          Link To Project
        </>
      )}
    </Button>
  );
}
