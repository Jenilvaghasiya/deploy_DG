import React, { useState } from 'react';
import { Clock } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const TimeRangeFilter = ({ startTime, endTime, onStartTimeChange, onEndTimeChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tempStartTime, setTempStartTime] = useState(startTime);
  const [tempEndTime, setTempEndTime] = useState(endTime);

  const handleOpen = () => {
    // Reset temp values to current values when opening
    setTempStartTime(startTime);
    setTempEndTime(endTime);
    setIsOpen(true);
  };

  const handleOk = () => {
    // Apply the changes to parent state
    onStartTimeChange(tempStartTime);
    onEndTimeChange(tempEndTime);
    setIsOpen(false);
  };

  const handleCancel = () => {
    // Reset temp values and close
    setTempStartTime(startTime);
    setTempEndTime(endTime);
    setIsOpen(false);
  };

  const formatTimeDisplay = (time) => {
    if (!time) return 'Not set';
    // Convert 24h format to 12h format with AM/PM
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return (
    <>
      <Button
        onClick={handleOpen}
        variant={'dg_btn'}
        className="flex items-center gap-2 w-[200px] justify-between bg-black/20 backdrop-blur-sm border-white/10 text-white hover:bg-black/30"
      >
        <Clock className="w-4 h-4" />
        <span className="text-sm">
          {startTime || endTime
            ? `${formatTimeDisplay(startTime)} - ${formatTimeDisplay(endTime)}`
            : 'Select Time Range'}
        </span>
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md  text-white border-white/20">
          <DialogHeader>
            <DialogTitle>Select Time Range</DialogTitle>
          </DialogHeader>
          
          <div className="flex flex-col gap-4 py-4">
            <div className="flex items-center gap-2">
              <span className="min-w-20 text-sm">Start Time:</span>
              <input
                type="time"
                value={tempStartTime}
                onChange={(e) => setTempStartTime(e.target.value)}
                className="bg-white/10 border border-white/35 rounded-md px-3 py-2 text-white flex-1 focus:outline-none focus:ring-2 focus:ring-white/50"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <span className="min-w-20 text-sm">End Time:</span>
              <input
                type="time"
                value={tempEndTime}
                onChange={(e) => setTempEndTime(e.target.value)}
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

export default TimeRangeFilter;