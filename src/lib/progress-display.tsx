// src/lib/progress-display.tsx
import React from "react";

/**
 * Utility for handling progress display with empty state logic
 * 
 * USAGE:
 * 1. For displaying ratios (e.g., "3/5"):
 *    {formatProgressRatio(completed, total)}
 * 
 * 2. For displaying with fallback text:
 *    {formatProgressRatio(completed, total, "No items yet")}
 * 
 * 3. For conditionally rendering content:
 *    {hasProgress(total) ? <ProgressBar /> : <EmptyMessage />}
 */

/**
 * Check if there's any progress to display
 */
export function hasProgress(total: number): boolean {
  return total > 0;
}

/**
 * Format a progress ratio as "completed / total" or return empty state message
 * @param completed - Number of completed items
 * @param total - Total number of items
 * @param emptyStateText - Text to show when total is 0 (default: "—")
 * @returns Formatted string
 */
export function formatProgressRatio(
  completed: number,
  total: number,
  emptyStateText: string = "—"
): string {
  if (total === 0) {
    return emptyStateText;
  }
  return `${completed} / ${total}`;
}

/**
 * Format a progress description for milestones/timelines
 * @param completed - Number of completed items
 * @param total - Total number of items
 * @param itemName - Name of the items (e.g., "tasks", "forms")
 * @param emptyStateText - Text to show when total is 0
 * @returns Formatted string
 */
export function formatProgressDescription(
  completed: number,
  total: number,
  itemName: string,
  emptyStateText?: string
): string {
  if (total === 0) {
    return emptyStateText || `No ${itemName} assigned yet`;
  }
  return `${completed} of ${total} ${itemName} completed`;
}

/**
 * Calculate percentage, returning 0 if total is 0
 */
export function calculatePercentage(completed: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
}

/**
 * Component: Display progress ratio with automatic empty state handling
 */
interface ProgressRatioProps {
  completed: number;
  total: number;
  emptyStateText?: string;
  className?: string;
}

export function ProgressRatio({
  completed,
  total,
  emptyStateText = "—",
  className = "",
}: ProgressRatioProps) {
  return (
    <span className={className}>
      {formatProgressRatio(completed, total, emptyStateText)}
    </span>
  );
}

/**
 * Component: Display progress description with automatic empty state handling
 */
interface ProgressDescriptionProps {
  completed: number;
  total: number;
  itemName: string;
  emptyStateText?: string;
  className?: string;
}

export function ProgressDescription({
  completed,
  total,
  itemName,
  emptyStateText,
  className = "",
}: ProgressDescriptionProps) {
  return (
    <span className={className}>
      {formatProgressDescription(completed, total, itemName, emptyStateText)}
    </span>
  );
}

/**
 * Hook: Get progress state and helpers
 */
export function useProgressState(completed: number, total: number) {
  const hasItems = hasProgress(total);
  const percentage = calculatePercentage(completed, total);
  const isComplete = hasItems && percentage === 100;
  const isInProgress = hasItems && percentage > 0 && percentage < 100;
  const isEmpty = !hasItems;

  return {
    hasItems,
    percentage,
    isComplete,
    isInProgress,
    isEmpty,
    formatRatio: (emptyText?: string) => formatProgressRatio(completed, total, emptyText),
    formatDescription: (itemName: string, emptyText?: string) =>
      formatProgressDescription(completed, total, itemName, emptyText),
  };
}
