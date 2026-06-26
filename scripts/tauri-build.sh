#!/bin/bash
set -e

echo "🔧 Preparing Tauri build..."

BACKUP_DIR="_tauri_build_backup"

cleanup() {
  if [ -d "$BACKUP_DIR" ]; then
    if [ -d "$BACKUP_DIR/api" ]; then mv "$BACKUP_DIR/api" app/api; fi
    if [ -d "$BACKUP_DIR/demo" ]; then mv "$BACKUP_DIR/demo" app/demo; fi
    if [ -f "$BACKUP_DIR/robots.ts" ]; then mv "$BACKUP_DIR/robots.ts" app/robots.ts; fi
    rm -rf "$BACKUP_DIR"
  fi
}
trap cleanup EXIT

mkdir -p "$BACKUP_DIR"

for item in api demo robots.ts; do
  if [ -e "app/$item" ]; then
    echo "  → Moving app/$item"
    mv "app/$item" "$BACKUP_DIR/$item"
  fi
done

echo "  → Running Next.js static export..."
NEXT_PUBLIC_STORAGE_MODE=local NEXT_PUBLIC_TAURI=true OUTPUT_MODE=export npx next build 2>&1

echo "✅ Tauri build ready"