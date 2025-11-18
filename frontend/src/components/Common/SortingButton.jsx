import { useState } from "react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ChevronDown, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"

const sortOptions = [
  { value: "name", label: "Name" },
  { value: "created-date", label: "Created Date" },
  { value: "updated-date", label: "Updated Date" },
]

export function SortDropdown({ onSortChange, currentSort = "name-asc", showNameSort = true }) {
  // Parse the current sort to get field and direction
  const [sortField, sortDirection] = currentSort.includes('-') 
    ? currentSort.split('-').slice(0, -1).join('-') && [currentSort.split('-').slice(0, -1).join('-'), currentSort.split('-').pop()]
    : [currentSort, 'asc']
  
  const [selectedField, setSelectedField] = useState(sortField)
  const [selectedDirection, setSelectedDirection] = useState(sortDirection)

  const handleFieldChange = (field) => {
    setSelectedField(field)
    const newSort = `${field}-${selectedDirection}`
    onSortChange(newSort)
  }

  const toggleDirection = () => {
    const newDirection = selectedDirection === 'asc' ? 'desc' : 'asc'
    setSelectedDirection(newDirection)
    const newSort = `${selectedField}-${newDirection}`
    onSortChange(newSort)
  }

  const getCurrentSortLabel = () => {
    const option = sortOptions.find((opt) => opt.value === selectedField)
    if (!option) return "Sort by"
    
    let directionLabel = ""
    if (selectedField === "name") {
      directionLabel = selectedDirection === 'asc' ? " (A-Z)" : " (Z-A)"
    } else {
      directionLabel = selectedDirection === 'asc' ? " (Oldest First)" : " (Newest First)"
    }
    
    return option.label + directionLabel
  }

  const getDirectionTooltip = () => {
    if (selectedField === "name") {
      return selectedDirection === 'asc' ? "A to Z → Z to A" : "Z to A → A to Z"
    } else {
      return selectedDirection === 'asc' ? "Oldest → Newest" : "Newest → Oldest"
    }
  }

  const displayOptions = showNameSort 
    ? sortOptions 
    : sortOptions.filter(opt => opt.value !== "name")

  return (
    <div className="flex items-center gap-1">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            className="text-xs 2xl:text-base py-1.5 2xl:py-2 h-auto flex items-center gap-2 bg-white/10 border-white/30 rounded-r-none border-r-0"
          >
            <ArrowUpDown className="h-4 w-4" />
            {getCurrentSortLabel()}
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 bg-white/35 backdrop-blur-sm">
          {displayOptions.map((option) => (
            <DropdownMenuItem
              key={option.value}
              onClick={() => handleFieldChange(option.value)}
              className={`${selectedField === option.value ? "bg-black/10" : ""} cursor-pointer`}
            >
              {option.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      
      <Button
        variant="outline"
        size="icon"
        onClick={toggleDirection}
        className="h-auto w-auto p-1.5 2xl:p-2 bg-white/10 border-white/30 rounded-l-none hover:bg-white/20"
        title={getDirectionTooltip()}
      >
        {selectedDirection === 'asc' 
          ? <ArrowDown className="h-4 w-4" />
          : <ArrowUp className="h-4 w-4" />
        }
      </Button>
    </div>
  )
}