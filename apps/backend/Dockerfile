# Use a Node.js Alpine image as the base
FROM node:20-alpine AS base

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json (or yarn.lock)
COPY package*.json ./

# -- Backend Specific Build Stage --
FROM base AS backend-builder

# Install only production dependencies
# Ensure npm ci is used if package-lock.json is present for reproducible builds
RUN npm ci --only=production

# Copy the rest of the backend application code
# This assumes .dockerignore is properly set up at the root or in this directory
COPY . .

# Build the TypeScript application
# This will compile TypeScript to JavaScript in the 'dist' folder
RUN npm run build

# -- Production Stage --
# Use a lightweight Node.js Alpine image
FROM node:20-alpine AS production

ENV NODE_ENV=production

WORKDIR /usr/src/app

# Copy package.json and package-lock.json again for this stage
COPY package*.json ./

# Install production dependencies (could also copy from backend-builder's node_modules if done carefully)
RUN npm ci --only=production

# Copy the built application (dist folder) and other necessary files from the backend-builder stage
COPY --from=backend-builder /usr/src/app/dist ./dist
# If you have other assets or files needed for runtime that are not in 'dist', copy them too.
# e.g. COPY --from=backend-builder /usr/src/app/public ./public

# Expose the port the app runs on (ensure this matches your .env or config)
# The actual port should be set by an environment variable, e.g., BACKEND_PORT_CONTAINER
EXPOSE ${BACKEND_PORT_CONTAINER}

# Command to start the application
# This should point to your built application's entry point
CMD ["npm", "start"]
