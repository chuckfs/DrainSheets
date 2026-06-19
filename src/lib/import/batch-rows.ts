export const ROW_BATCH_SIZE = 200;

export function chunkRows<T>(rows: T[], batchSize = ROW_BATCH_SIZE): T[][] {
  const batches: T[][] = [];

  for (let offset = 0; offset < rows.length; offset += batchSize) {
    batches.push(rows.slice(offset, offset + batchSize));
  }

  return batches;
}

export function buildRowInsertPayloads<T extends Record<string, unknown>>(
  rows: T[],
  sheetId: string,
  orgId: string,
  profileId: string,
  batchSize = ROW_BATCH_SIZE,
): Array<Array<{ sheet_id: string; org_id: string; position: number; data: T; created_by: string }>> {
  return chunkRows(rows, batchSize).map((batch, batchIndex) =>
    batch.map((data, index) => ({
      sheet_id: sheetId,
      org_id: orgId,
      position: batchIndex * batchSize + index,
      data,
      created_by: profileId,
    })),
  );
}
