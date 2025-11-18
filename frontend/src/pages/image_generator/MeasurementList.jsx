import React from "react";
import { CheckCircle2 } from "lucide-react";

const MeasurementList = ({ measurementData }) => {
  console.log(measurementData);
 if (!measurementData) {
  return (
    <div className="flex flex-col items-center justify-center h-60 max-w-sm bg-white/10 border border-white/35 border-shadow-blur rounded-lg shadow-md p-6 text-center">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="w-12 h-12 text-white mb-3"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9.75 9.75h.008v.008H9.75V9.75zm.75 2.25h3v3h-3v-3zM12 2.25c5.385 0 9.75 4.365 9.75 9.75s-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12 6.615 2.25 12 2.25z"
        />
      </svg>
      <p className="text-white text-base">No measurement data available</p>
      <p className="text-sm text-white">Either no data was found or there was an error fetching it.</p>
    </div>
  );
}


  return (
    <div className="max-w-sm bg-white border border-gray-300 rounded-lg shadow-md p-4">
      <h2 className="text-lg font-semibold mb-4">
        Standard Measurement Points
      </h2>
      <div className="max-h-60 overflow-y-auto pr-2 space-y-3">
        {measurementData.measurement_points.map((point) => (
          <div key={point} className="flex items-start gap-2">
            <CheckCircle2
              className="text-green-500 min-w-[1.25rem]"
              size={20}
            />
            <p>
              <span className="font-semibold">{point.replace(/_/g, " ")}</span>{" "}
              - {measurementData.measurement_instructions[point]}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MeasurementList;
