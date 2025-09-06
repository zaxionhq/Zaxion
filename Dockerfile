# Use a lightweight Node.js image
FROM node:20-alpine

# Set the working directory in the container
WORKDIR /app/backend

# Copy package.json and package-lock.json (if any)
# to install dependencies
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the backend application code
COPY . .

# Build the frontend (if applicable) - Assuming frontend is in a sibling directory or handled separately
# If the frontend build is part of the backend Dockerfile, this needs adjustment.
# For now, we assume the backend serves a pre-built frontend or frontend is served separately.

# Expose the port the app runs on
EXPOSE 5000

# Command to run the application
CMD ["npm", "run", "dev"]
