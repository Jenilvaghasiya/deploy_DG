  import { useState } from 'react';
  import { Calendar } from 'lucide-react';
  import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogClose,
    DialogFooter,
  } from "@/components/ui/dialog";
  import { Button } from "@/components/ui/button";

  export default function DateRangePickerModal({ onSelectRange }) {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const handleStartDateChange = (e) => {
      setStartDate(e.target.value);
    };

    const handleEndDateChange = (e) => {
      setEndDate(e.target.value);
    };

    const handleApply = () => {
      if (startDate && endDate) {
        onSelectRange({ startDate, endDate });
      }
    };

    return (
      <Dialog>
        <DialogTrigger asChild>
        <Button className="flex items-center gap-2  border-zinc-700 text-white focus:ring-2 focus:ring-zinc-500">
    <Calendar className="w-4 h-4 text-white" />
  </Button>

        </DialogTrigger>
        <DialogContent
          className="sm:max-w-md !rounded-xl  border border-gray-700 text-white"
          style={{ zIndex: 9999 }}
        >
          <DialogHeader>
            <DialogTitle className="text-white">Select Date Range</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-200">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={handleStartDateChange}
                className="w-full px-4 py-2 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-200">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={handleEndDateChange}
                min={startDate}
                className="w-full px-4 py-2  border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
            </div>
          </div>

          <DialogFooter className="flex flex-row justify-end gap-3">
            <DialogClose asChild>
              <Button variant={'dg_btn'}>
                Cancel
              </Button>
            </DialogClose>

            <DialogClose asChild>
              <Button
                onClick={handleApply}
                disabled={!startDate || !endDate}
                variant={'dg_btn'}
              >
                Apply
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }
