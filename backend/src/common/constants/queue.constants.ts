export const QUEUES = {
  CATALOG_SYNC: 'catalog_sync_queue',
  STOCK_UPDATE: 'stock_update_queue',
  LABEL_POLLING: 'label_polling_queue',
  ORDER_SYNC: 'order_sync_queue',
  ORDER_INGESTION: 'order_ingestion_queue',
  FINANCE_LEDGER: 'finance_ledger_queue',
  INVENTORY_UPDATE: 'inventory_update_queue',
  CARGO_BARCODE: 'cargo_barcode_queue',
} as const;
