#!/bin/bash

DATE=$(date +"%Y-%m-%d_%H-%M")
BACKUP_DIR="/var/backups/neu-hall-events"
DB_NAME="neu_hall_events"
MONGO_URI="${MONGO_URI:-mongodb://localhost:27017}"

mkdir -p "$BACKUP_DIR"

mongodump \
  --uri="$MONGO_URI" \
  --db="$DB_NAME" \
  --out="$BACKUP_DIR/$DATE" \
  --gzip

# Remove backups older than 30 days
find "$BACKUP_DIR" -mtime +30 -exec rm -rf {} +

echo "Backup completed: $BACKUP_DIR/$DATE"