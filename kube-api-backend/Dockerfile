FROM node:18-alpine

# Install dependencies required for kubectl
RUN apk add --no-cache \
    curl \
    ca-certificates \
    bash \
    openssl

# Install kubectl (stable)
RUN curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl" \
    && chmod +x kubectl \
    && mv kubectl /usr/local/bin/kubectl

# Verify kubectl install
RUN kubectl version --client=true

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3001
CMD ["npm", "start"]
