import React from "react";
import { Button } from "@/components/ui/button";
import { Link as LinkIcon } from "lucide-react";

export default function AddLinkUnlinkButton({
  sizeChartIDs = [],
  setSizeChartIDs,
  currentTableID,
}) {
  const isConnected = sizeChartIDs.includes(currentTableID);

  const handleLink = () => {
    if (!isConnected) {
      setSizeChartIDs((prev) => [...prev, currentTableID]);
    }
  };

  const handleUnlink = () => {
    if (isConnected) {
      setSizeChartIDs((prev) =>
        prev.filter((id) => id !== currentTableID)
      );
    }
  };

  return isConnected ? (
    <Button
      size="sm"
      onClick={handleUnlink}
      variant="destructive"
      className="text-xs"
    >
      Unlink
    </Button>
  ) : (
    <Button
      size="sm"
      onClick={handleLink}
      className="text-xs flex items-center"
    >
      <LinkIcon className="w-3 h-3 mr-1" />
      Link To Project
    </Button>
  );
}
