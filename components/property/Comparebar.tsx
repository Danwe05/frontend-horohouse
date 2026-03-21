"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { X, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const MAX_COMPARE = 3;

interface UseCompareReturn {
  compared: string[];
  isCompared: (id: string) => boolean;
  handleCompareChange: (id: string, checked: boolean) => void;
  clearCompare: () => void;
}

/**
 * Hook to manage property comparison state.
 * Pass `compared` and `handleCompareChange` down to <PropertyCard>.
 */
export function useCompare(): UseCompareReturn {
  const [compared, setCompared] = useState<string[]>([]);

  const isCompared = useCallback(
    (id: string) => compared.includes(id),
    [compared]
  );

  const handleCompareChange = useCallback(
    (id: string, checked: boolean) => {
      if (checked) {
        if (compared.length >= MAX_COMPARE) return; // silently cap
        setCompared((prev) => [...prev, id]);
      } else {
        setCompared((prev) => prev.filter((c) => c !== id));
      }
    },
    [compared]
  );

  const clearCompare = useCallback(() => setCompared([]), []);

  return { compared, isCompared, handleCompareChange, clearCompare };
}

// ---------------------------------------------------------------------------

interface CompareBarProps {
  compared: string[];
  onClear: () => void;
  onRemove: (id: string) => void;
}

/**
 * Sticky bottom bar shown when 2+ properties are selected for comparison.
 */
export const CompareBar = ({ compared, onClear, onRemove }: CompareBarProps) => {
  if (compared.length < 2) return null;

  const compareUrl = `/properties/compare?ids=${compared.join(",")}`;

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 bg-background border-t -lg px-4 py-3 flex items-center justify-between gap-4">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-medium text-muted-foreground">
          Comparing {compared.length} properties:
        </span>
        {compared.map((id) => (
          <span
            key={id}
            className="inline-flex items-center gap-1 bg-muted text-xs px-2 py-1 rounded-full"
          >
            #{id.slice(-6)}
            <button
              onClick={() => onRemove(id)}
              aria-label={`Remove property ${id} from comparison`}
              className="hover:text-destructive"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Button variant="ghost" size="sm" onClick={onClear}>
          Clear
        </Button>
        <Button size="sm" asChild>
          <Link href={compareUrl} className="flex items-center gap-1">
            Compare
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
};