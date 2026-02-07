
## Usage
- Run the command `./up.sh` from the root folder (3rdSpace) in git bash to start all services for development, including tests.
- The startup script will run npm install via the host and then start the containers using `docker compose -f docker-compose.dev.yml up --build`.
- You can edit up.sh to run `docker compose -f docker-compose.yml up --build` to get only the database, frontend, and backend containers.
- There is an account already set up with username: `user1` and password: `password` but you can also register new accounts