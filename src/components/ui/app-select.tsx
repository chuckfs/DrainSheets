"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";

/** Internal sentinel — maps to empty string in option values. */
export const APP_SELECT_EMPTY = "__app_select_empty__";

export type AppSelectOption<T extends string = string> = {
  value: T;
  label: ReactNode;
  disabled?: boolean;
};

function toInternalValue(value: string | undefined): string {
  return value === "" || value === undefined ? APP_SELECT_EMPTY : value;
}

function toExternalValue(value: string): string {
  return value === APP_SELECT_EMPTY ? "" : value;
}

export function resolveAppSelectLabel(
  value: string | undefined,
  options: AppSelectOption[],
  placeholder?: string,
): ReactNode {
  const match = options.find((option) => toInternalValue(option.value) === toInternalValue(value));
  if (match) {
    return match.label;
  }

  return placeholder ?? "";
}

type AppSelectBaseProps<T extends string = string> = {
  id?: string;
  options: AppSelectOption<T>[];
  placeholder?: string;
  disabled?: boolean;
  size?: "sm" | "default";
  className?: string;
  triggerClassName?: string;
  "aria-label"?: string;
  onValueChange?: (value: T) => void;
};

type ControlledAppSelectProps<T extends string = string> = AppSelectBaseProps<T> & {
  value: T;
  defaultValue?: never;
};

type UncontrolledAppSelectProps<T extends string = string> = AppSelectBaseProps<T> & {
  value?: never;
  defaultValue?: T;
};

export type AppSelectProps<T extends string = string> =
  | ControlledAppSelectProps<T>
  | UncontrolledAppSelectProps<T>;

export function AppSelect<T extends string = string>({
  id,
  value,
  defaultValue,
  onValueChange,
  options,
  placeholder,
  disabled,
  size = "default",
  className,
  triggerClassName,
  "aria-label": ariaLabel,
}: AppSelectProps<T>) {
  const mappedOptions = options.map((option) => ({
    ...option,
    internalValue: toInternalValue(option.value),
  }));

  const handleChange = (next: string | null | undefined) => {
    if (next === null || next === undefined) {
      return;
    }
    onValueChange?.(toExternalValue(next) as T);
  };

  const selectedValue = value !== undefined ? value : defaultValue;
  const displayLabel = resolveAppSelectLabel(selectedValue, options, placeholder);

  const selectProps =
    value !== undefined
      ? { value: toInternalValue(value), onValueChange: handleChange }
      : {
          defaultValue: toInternalValue(defaultValue),
          onValueChange: handleChange,
        };

  return (
    <Select {...selectProps} disabled={disabled}>
      <SelectTrigger
        id={id}
        size={size}
        aria-label={ariaLabel}
        className={cn(
          "w-full",
          size === "sm" && "h-7 text-xs",
          triggerClassName,
          className,
        )}
      >
        <span
          className={cn(
            "flex flex-1 truncate text-left",
            !displayLabel && "text-muted-foreground",
          )}
        >
          {displayLabel || placeholder || "Select…"}
        </span>
      </SelectTrigger>
      <SelectContent>
        {mappedOptions.map((option) => (
          <SelectItem
            key={option.internalValue}
            value={option.internalValue}
            disabled={option.disabled}
          >
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
