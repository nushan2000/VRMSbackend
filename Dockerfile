# FROM node

# WORKDIR /app

# COPY package.json .

# RUN npm install

# COPY . .
# EXPOSE 8080

# CMD ["npm" , "start"]

# Base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application source code
COPY . .

# Expose the port your app uses
EXPOSE 8080

# Run your application
CMD ["node", "server.js"]