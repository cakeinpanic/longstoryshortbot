# Use the official Node.js 14 image as the base image
FROM node:18

# Set the working directory inside the container
WORKDIR /app
# Copy package.json and package-lock.json to the working directory
COPY package*.json ./
# Install dependencies
RUN npm install

COPY . .
EXPOSE 3000
# Start the Node.js process
CMD [ "npm", "start" ]
