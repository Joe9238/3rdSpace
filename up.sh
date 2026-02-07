set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "Installing frontend dependencies..."
cd frontend
npm install

echo "Installing backend dependencies..."
cd ../backend
npm install

cd "$SCRIPT_DIR"

echo "Starting docker compose..."
docker compose -f docker-compose.dev.yml up --build