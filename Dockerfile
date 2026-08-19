FROM node:18-alpine

WORKDIR /app

# Install production dependencies only.
COPY package*.json ./
RUN npm ci --omit=dev || npm install --omit=dev

# Copy application source.
COPY src ./src
COPY presets ./presets
COPY .env.example .env.example

# Expose the API port.
EXPOSE 3000

# Run the API.
CMD ["npm", "start"]
