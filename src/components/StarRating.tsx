"use client";

import { Star } from "lucide-react";
import { useState } from "react";

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  readOnly?: boolean;
  size?: number;
}

export default function StarRating({
  value,
  onChange,
  readOnly = false,
  size = 20,
}: StarRatingProps) {
  const [hover, setHover] = useState<number | null>(null);

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readOnly}
          onClick={() => onChange?.(star)}
          onMouseEnter={() => !readOnly && setHover(star)}
          onMouseLeave={() => !readOnly && setHover(null)}
          className={readOnly ? "cursor-default" : "cursor-pointer"}
        >
          <Star
            size={size}
            fill={(hover ?? value) >= star ? "#facc15" : "none"}
            stroke={(hover ?? value) >= star ? "#facc15" : "#d1d5db"}
          />
        </button>
      ))}
    </div>
  );
}