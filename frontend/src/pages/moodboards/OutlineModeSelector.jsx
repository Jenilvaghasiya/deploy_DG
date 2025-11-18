import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";

const OutlineModeSelector = ({ open, onOpenChange, onSelect }) => {
  const modes = [
    {
      id: 'base',
      title: 'Base',
      description: 'Simple silhouette outline',
      features: ['Fast processing', 'Basic garment shape', 'Quick results'],
      icon: '📋',
      color: 'bg-slate-700 hover:bg-slate-600 border-slate-600'
    },
    {
      id: 'advanced',
      title: 'Advanced',
      description: 'Structural details included',
      features: ['Better accuracy', 'Seams & stitching', 'Moderate detail'],
      icon: '⚙️',
      color: 'bg-blue-900/50 hover:bg-blue-800/50 border-blue-600',
      recommended: false
    },
    {
      id: 'professional',
      title: 'Professional',
      description: 'Complete technical flat',
      features: ['Highest detail level', 'All hardware & trims', 'Production ready'],
      icon: '🏆',
      color: 'bg-purple-900/50 hover:bg-purple-800/50 border-purple-500',
      recommended: true
    }
  ];

  const handleModeSelect = (modeId) => {
    onSelect(modeId);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center">
            Select Outline Mode
          </DialogTitle>
          <DialogDescription className="text-center text-gray-400">
            Choose the level of detail for your garment outline
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-6">
          {modes.map((mode) => (
            <div
              key={mode.id}
              onClick={() => handleModeSelect(mode.id)}
              className={`
                relative cursor-pointer rounded-lg border-2 p-6 
                transition-all duration-200 hover:shadow-xl hover:scale-105
                ${mode.color}
                ${mode.recommended ? 'ring-2 ring-purple-500 ring-offset-2 ring-offset-background' : ''}
              `}
            >
              {mode.recommended && (
                <Badge 
                  className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-purple-600 hover:bg-purple-600"
                >
                  RECOMMENDED
                </Badge>
              )}
              
              <div className="text-center mb-4">
                <div className="text-4xl mb-3">{mode.icon}</div>
                <h4 className="font-semibold text-lg text-white mb-1">
                  {mode.title}
                </h4>
                <p className="text-xs text-gray-400">
                  {mode.description}
                </p>
              </div>
              
              <div className="space-y-2">
                {mode.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-300">{feature}</span>
                  </div>
                ))}
              </div>

              {mode.recommended && (
                <div className="mt-4 pt-4 border-t border-purple-500/30">
                  <p className="text-xs text-center text-purple-300">
                    Best for production-ready outputs
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OutlineModeSelector;