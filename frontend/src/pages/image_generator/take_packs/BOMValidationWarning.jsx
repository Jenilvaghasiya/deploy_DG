import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function BOMValidationWarning({ 
  isOpen, 
  blankItems, 
  onReview, 
  onSaveAnyway,
  onCancel 
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-full max-w-md space-y-4 mx-4 shadow-xl">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-1" />
          <div>
            <h3 className="text-lg font-bold text-white mb-1">Incomplete BOM</h3>
            <p className="text-sm text-gray-300">
              {blankItems.length} item{blankItems.length !== 1 ? 's' : ''} {blankItems.length !== 1 ? 'have' : 'has'} missing required fields.
            </p>
          </div>
        </div>

        {/* List of blank items */}
        <div className="bg-zinc-800/50 rounded-lg p-3 max-h-[200px] overflow-y-auto space-y-2">
          {blankItems.slice(0, 5).map((blank, idx) => (
            <div key={idx} className="text-sm">
              <div className="text-gray-300 font-medium">
                Item #{blank.index + 1} {blank.item && `- ${blank.item}`}
              </div>
              <div className="text-xs text-red-400">
                Missing: {blank.blankFields.join(', ')}
              </div>
            </div>
          ))}
          {blankItems.length > 5 && (
            <div className="text-xs text-gray-400 italic">
              +{blankItems.length - 5} more items with blank fields
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <Button
            onClick={onCancel}
            variant="outline"
            className="flex-1 text-gray-300 border-zinc-600 hover:bg-zinc-800"
          >
            Cancel
          </Button>
          <Button
            onClick={onReview}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
          >
            Review
          </Button>
          <Button
            onClick={onSaveAnyway}
            className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white"
          >
            Save Anyway
          </Button>
        </div>
      </div>
    </div>
  );
}