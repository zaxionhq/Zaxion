# Use a lightweight Node.js image
FROM node:20-alpine

# Set the working directory in the container
# Railway/Render will look into this directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install only production dependencies for a smaller, faster image
RUN npm install --omit=dev

# Copy the rest of the backend application code
COPY . .

# Expose the port the app runs on (Railway/Render will use this)
EXPOSE 5000

# Command to run the application in production
# This ensures the process is stable and doesn't use nodemon
CMD ["npm", "start"]
