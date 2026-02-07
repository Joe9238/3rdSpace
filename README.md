## Containers

### 1. `frontend`
- **Purpose:** Runs the React frontend application.
- **Details:**
  - Accessible via http://localhost:81 on the host's browser
  - Waits for the backend to be available before starting.

### 2. `frontend-e2e`
- **Purpose:** Runs a separate duplicate instance of the frontend for end-to-end testing.
- **Details:**
  - Waits for the backend to be available before starting.
  - Isn't visible to the host.
  - Will remain running after testing is complete.

### 3. `backend`
- **Purpose:** Runs the Node.js backend API server.
- **Details:**
  - Exposes port 82 (mapped to 9000 inside the container).
  - Waits for the database to be available before starting.

### 4. `database`
- **Purpose:** Runs a MongoDB database.
- **Details:**
  - Exposes port 83 (mapped to 27017 inside the container).
  - Connect via mongodb://root:UOP7a7a2025@localhost:83/hellohotel?authSource=admin&directConnection=true
  - Runs a migration script for intial data upon creation.

### 5. `backend-test`
- **Purpose:** Runs backend integration tests using Mocha/Chai by calling endpoints and validating its actions.
- **Details:**
  - Waits for a response from the backend before running tests using wait-for-backend-health.sh.
  - Container will shut down after running the tests.
  - Test results can be found in the container console.

### 6. `frontend-test`
- **Purpose:** Runs frontend unit tests using Jest.
- **Details:**
  - Waits for a response from the backend before running tests using wait-for-backend-health.sh.
  - Container will shut down after running the tests.
  - Test results can be found in the container console.

### 7. `e2e-test`
- **Purpose:** Runs end-to-end tests for the application.
- **Details:**
  - Waits for a response from the backend before running tests using wait-for-backend-health.sh.
  - Will wait for a response from the frontend-e2e container before running tests using an internal loop.
  - Runs tests using Selenium.
  - Container will shut down after running the tests.
  - Test results can be found in the container console.

### 8. `selenium`
- **Purpose:** Provides a Selenium server with Chrome for running browser-based end-to-end tests.
- **Details:**
  - Exposes port 4444 for WebDriver connections.
  - Will remain running after testing is complete.

---

## Usage
- Run the command `./up.sh` from the root folder (HelloHotel) in git bash to start all services for development, including tests.
- The startup script will run npm install via the host and then start the containers using `docker compose -f docker-compose.dev.yml up --build`.
- You can edit up.sh to run `docker compose -f docker-compose.yml up --build` to get only the database, frontend, and backend containers.
- There is an account already set up with username: `user1` and password: `password` but you can also register new accounts