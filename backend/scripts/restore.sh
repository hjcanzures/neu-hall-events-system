#!/bin/bash

BACKUP_PATH=$1
DB_NAME="neu_hall_events"
MONGO_URI="${MONGO_URI:-mongodb://localhost:27017}"

if [ -z "$BACKUP_PATH" ]; then
  echo "Usage: ./restore.sh <backup-path>"
  exit 1
fi

echo "Restoring $DB_NAME from $BACKUP_PATH ..."

mongorestore \
  --uri="$MONGO_URI" \
  --db="$DB_NAME" \
  --drop \
  --gzip \
  "$BACKUP_PATH/$DB_NAME"

echo "Restore complete."