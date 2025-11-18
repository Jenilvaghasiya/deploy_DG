import React, { useState } from "react";
import { Calendar } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const DateRangeFilter = ({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tempStartDate, setTempStartDate] = useState(startDate);
  const [tempEndDate, setTempEndDate] = useState(endDate);

  const handleOpen = () => {
    // Reset temp values to current values when opening
    setTempStartDate(startDate);
    setTempEndDate(endDate);
    setIsOpen(true);
  };

  const handleOk = () => {
    // Apply the changes to parent state
    onStartDateChange(tempStartDate);
    onEndDateChange(tempEndDate);
    setIsOpen(false);
  };

  const handleCancel = () => {
    // Reset temp values and close
    setTempStartDate(startDate);
    setTempEndDate(endDate);
    setIsOpen(false);
  };

  const formatDateDisplay = (date) => {
    if (!date) return "Not set";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <>
      <Button
        onClick={handleOpen}
        className="flex items-center gap-2 bg-white/10 border border-white/35 rounded-md px-4 py-2 text-white hover:bg-white/20 transition-colors"
        variant={'dg_btn'}
      >
        <Calendar className="w-4 h-4" />
        <span className="text-sm">
          {startDate || endDate
            ? `${formatDateDisplay(startDate)} - ${formatDateDisplay(endDate)}`
            : "Select Date Range"}
        </span>
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md  text-white border-white/20">
          <DialogHeader>
            <DialogTitle>Select Date Range</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-4">
            <div className="flex items-center gap-2">
              <span className="min-w-20 text-sm">Start Date:</span>
              <input
                type="date"
                value={tempStartDate}
                onChange={(e) => setTempStartDate(e.target.value)}
                className="bg-white/10 border border-white/35 rounded-md px-3 py-2 text-white flex-1 focus:outline-none focus:ring-2 focus:ring-white/50"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="min-w-20 text-sm">End Date:</span>
              <input
                type="date"
                value={tempEndDate}
                onChange={(e) => setTempEndDate(e.target.value)}
                className="bg-white/10 border border-white/35 rounded-md px-3 py-2 text-white flex-1 focus:outline-none focus:ring-2 focus:ring-white/50"
              />
            </div>
          </div>

          <DialogFooter className="flex gap-2 sm:gap-2">
            <Button
              variant="outline"
              onClick={handleCancel}
              className="bg-transparent border-white/35 text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              onClick={handleOk}
              variant={'dg_btn'}
            >
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DateRangeFilter;
