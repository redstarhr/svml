# Stage 1: Use the official Node.js 20 image as a base.
# The 'slim' variant is smaller and contains the minimal packages needed to run Node.
FROM node:20-slim

# Set the working directory inside the container. All subsequent commands will run from here.
WORKDIR /app

# Set the NODE_ENV to 'production' by default.
# This ensures npm installs only production dependencies and can optimize some packages.
# This can be overridden at runtime if needed (e.g., for a development container).
ENV NODE_ENV=production

# Copy package.json and package-lock.json first.
# This leverages Docker's layer caching. If these files haven't changed, Docker
# won't re-run 'npm install' on subsequent builds, speeding up the process.
COPY package*.json ./

# Install production dependencies.
RUN npm ci --only=production

# Copy the rest of the application source code into the container.
# The .dockerignore file will prevent unnecessary files from being copied.
COPY . .

# The command to run when the container starts.
# This executes the bot's main entry point, index.js.
CMD ["node", "index.js"]