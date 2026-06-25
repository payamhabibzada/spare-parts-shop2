"use client";

import * as React from "react";

import { cn } from "./utils";

function Progress({
  value,
  max = 100,
  className,
  ...props
}: React.ComponentPropsWithoutRef<"progress">) {
  return (
    <progress
      value={value ?? undefined}
      max={max}
      className={cn("w-full h-2 overflow-hidden rounded-full appearance-none progress-progress", className)}
      {...props}
    />
  );
}

export { Progress };
