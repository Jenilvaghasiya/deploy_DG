// components/MeasurementTableDialog.jsx
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MeasurementTable } from "@/pages/image_generator/MeasurementTable";
import { Button } from "../ui/button";

function MeasurementTableDialog({
  open,
  setOpen,
  measurementTableData,
  setMeasurementTableData,
  sizeChartId,
  isAIGenerated,
}) {
  const [selectedMeasurement, setSelectedMeasurement] = useState(null);
console.log(measurementTableData, ' /////////////////');

  // Extract measurement keys dynamically
  const measurementKeys = measurementTableData
    ? Object.keys(measurementTableData)
    : [];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-2xl 2xl:max-w-4xl !rounded-xl">
        <DialogHeader>
          <DialogTitle>Measurement Table</DialogTitle>
        </DialogHeader>

        {/* Dropdown to select measurement */}
        <div className="mb-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                {selectedMeasurement || "Select Measurement"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Measurements</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {measurementKeys.length > 0 ? (
                measurementKeys.map((key) => (
                  <DropdownMenuItem
                    key={key}
                    onClick={() => setSelectedMeasurement(key)}
                  >
                    {key}
                  </DropdownMenuItem>
                ))
              ) : (
                <DropdownMenuItem disabled>No measurements found</DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Show selected measurement table */}
        {selectedMeasurement && (
          <div className="bg-white/20 backdrop-blur-md border border-white/25 rounded-2xl shadow-xl p-4">
            <MeasurementTable
              measurements={{
                [selectedMeasurement]: measurementTableData[selectedMeasurement],
              }}
              setMeasurement={setMeasurementTableData}
              sizeChartId={sizeChartId}
              isEditable={false}
              isAIGenerated={isAIGenerated}
              showDuplicateButton={false}
              showLinkProjectButton={false}
            />
          </div>
        )}

        <DialogFooter className="mt-4">
          <DialogClose asChild>
            <Button variant="dg_btn">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default MeasurementTableDialog;
