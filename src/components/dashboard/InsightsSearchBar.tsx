'use client';

import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';

interface InsightsSearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filterType: string;
  onFilterChange: (type: string) => void;
  resultCount: number;
}

export default function InsightsSearchBar({
  searchQuery,
  onSearchChange,
  filterType,
  onFilterChange,
  resultCount,
}: InsightsSearchBarProps) {
  const hasActiveFilters = searchQuery || filterType !== 'all';

  const clearFilters = () => {
    onSearchChange('');
    onFilterChange('all');
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
      {/* Search Input */}
      <div className="relative flex-1 w-full">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search insights and documents..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 pr-10"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
            onClick={() => onSearchChange('')}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Type Filter */}
      <Select value={filterType} onValueChange={onFilterChange}>
        <SelectTrigger className="w-full sm:w-48">
          <SelectValue placeholder="Filter by type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          <SelectItem value="pattern">Patterns</SelectItem>
          <SelectItem value="contradiction">Contradictions</SelectItem>
          <SelectItem value="suggestion">Suggestions</SelectItem>
          <SelectItem value="trend">Trends</SelectItem>
          <SelectItem value="reminder">Reminders</SelectItem>
          <SelectItem value="ai">AI Generated</SelectItem>
          <SelectItem value="manual">Manual</SelectItem>
        </SelectContent>
      </Select>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <Button
          variant="outline"
          size="sm"
          onClick={clearFilters}
          className="whitespace-nowrap"
        >
          <X className="h-4 w-4 mr-2" />
          Clear
        </Button>
      )}

      {/* Result Count */}
      {hasActiveFilters && (
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          {resultCount} result{resultCount === 1 ? '' : 's'}
        </span>
      )}
    </div>
  );
}
