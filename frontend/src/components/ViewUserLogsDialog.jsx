import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { fetchActivityLog } from "@/features/dashboard/dashboardService";
import ActivityTable from "./dashboard/ActivityLogTable";

function ViewUserLogsDialog({
  open,
  setOpen,
  userId,
  userName = "User",
}) {
  const [logsData, setLogsData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10; // Adjust as needed

  useEffect(() => {
    if (open && userId) {
      fetchUserLogs();
    }
  }, [open, userId]);

  const fetchUserLogs = async () => {
    setLoading(true);
    try {
      // Replace with your actual API call
      const response = await fetchActivityLog({
        users: userId,
        // Add other filters as needed
      });
      setLogsData(response);
    } catch (error) {
      console.error("Error fetching user logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(logsData.length / PAGE_SIZE);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const paginatedData = logsData.slice(startIndex, startIndex + PAGE_SIZE);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-4xl !rounded-xl" style={{ zIndex: 9999 }}>
        <DialogHeader>
          <DialogTitle>Activity Logs - {userName}</DialogTitle>
        </DialogHeader>

        <div className="mt-4 max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <span className="text-zinc-300">Loading logs...</span>
            </div>
          ) : logsData.length > 0 ? (
            <>
              <ActivityTable paginatedData={paginatedData} />
              
              {/* Pagination controls */}
              {totalPages > 1 && (
                <div className="flex justify-between items-center mt-4 px-4">
                  <span className="text-sm text-zinc-300">
                    Page {currentPage} of {totalPages}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="dg_btn"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="dg_btn"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-zinc-300">
              No activity logs found for this user.
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-row justify-end gap-3 mt-4">
          <Button
            variant="dg_btn"
            onClick={() => setOpen(false)}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ViewUserLogsDialog;