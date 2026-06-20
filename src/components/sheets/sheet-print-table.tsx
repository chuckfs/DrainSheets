"use client";

import { useEffect } from "react";

export function SheetPrintTable({
  matrix,
  sheetName,
  autoPrint = false,
}: {
  matrix: string[][];
  sheetName: string;
  autoPrint?: boolean;
}) {
  useEffect(() => {
    if (!autoPrint) {
      return;
    }

    const timeout = window.setTimeout(() => window.print(), 300);
    return () => window.clearTimeout(timeout);
  }, [autoPrint]);

  const [header = [], ...body] = matrix;

  return (
    <div>
      <h1 className="mb-4 hidden text-xl font-semibold print:block">{sheetName}</h1>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            {header.map((cell) => (
              <th key={cell} className="border border-neutral-300 bg-neutral-100 px-2 py-1 text-left font-medium">
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {body.map((row, rowIndex) => (
            <tr key={`row-${rowIndex}`}>
              {row.map((cell, cellIndex) => (
                <td key={`${rowIndex}-${cellIndex}`} className="border border-neutral-300 px-2 py-1 align-top">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
