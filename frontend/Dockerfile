FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy application source
COPY . .

# Set environment variable for build time
ENV NEXT_PUBLIC_API_URL=http://localhost:8000

# Build production bundle
RUN npm run build

# Expose Next.js server port
EXPOSE 3000

# Start Next.js production server
CMD ["npm", "run", "start"]
