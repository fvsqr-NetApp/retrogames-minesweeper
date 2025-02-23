# Use the official Node.js 16 image as the base image
FROM node:16-slim

# Set the working directory inside the container
WORKDIR /app

# Copy package files first
COPY package*.json ./

# Set NODE_OPTIONS to limit memory usage and use npm ci for a clean install
ENV NODE_OPTIONS="--max-old-space-size=2048"
RUN npm install --omit=dev && \
    npm cache clean --force

# Copy the rest of the application code to the container
COPY . .

# Expose the port that the Express.js server will run on
EXPOSE 3000

# Start the Express.js server when the container starts
CMD [ "npm", "start" ]
