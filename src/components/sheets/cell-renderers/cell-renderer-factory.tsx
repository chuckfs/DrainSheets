"use client";

import type { ColumnType } from "@/types/domain";
import { CheckboxRenderer } from "./checkbox-renderer";
import { ContactRenderer } from "./contact-renderer";
import { CurrencyRenderer } from "./currency-renderer";
import { DateRenderer } from "./date-renderer";
import { EmailRenderer } from "./email-renderer";
import { LongTextRenderer } from "./long-text-renderer";
import { NumberRenderer } from "./number-renderer";
import { PhoneRenderer } from "./phone-renderer";
import { SelectRenderer } from "./select-renderer";
import { TextRenderer } from "./text-renderer";
import type { CellRendererComponent } from "./types";
import { UrlRenderer } from "./url-renderer";

const RENDERERS: Record<ColumnType, CellRendererComponent> = {
  text: TextRenderer,
  long_text: LongTextRenderer,
  number: NumberRenderer,
  currency: CurrencyRenderer,
  date: DateRenderer,
  url: UrlRenderer,
  email: EmailRenderer,
  phone: PhoneRenderer,
  select: SelectRenderer,
  checkbox: CheckboxRenderer,
  contact: ContactRenderer,
};

export function getCellRenderer(type: ColumnType): CellRendererComponent {
  return RENDERERS[type] ?? TextRenderer;
}

export function FallbackRenderer(props: React.ComponentProps<CellRendererComponent>) {
  const Renderer = getCellRenderer(props.column.type);
  return <Renderer {...props} />;
}
