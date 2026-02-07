#!/bin/sh
# wait-for-backend-health.sh <url> [timeout_seconds]
URL=$1
TIMEOUT=${2:-60}
INTERVAL=2
ELAPSED=0

if [ -z "$URL" ]; then
  echo "Usage: $0 <url> [timeout_seconds]"
  exit 1
fi

while [ $ELAPSED -lt $TIMEOUT ]; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$URL")
  if [ "$STATUS" = "200" ]; then
    echo "Backend healthy at $URL."
    exit 0
  fi
  sleep $INTERVAL
  ELAPSED=`expr $ELAPSED + $INTERVAL`
done

echo "Timeout waiting for backend health at $URL."
exit 1
