# 1. Start with a lightweight Nginx web server image
FROM nginx:alpine

# 2. Copy the contents of your GitHub repo into the server's public folder
# The '.' means "copy everything from the current directory (GitHub root)"
COPY . /usr/share/nginx/html

# 3. Expose port 80 (standard HTTP port)
# This is where the container listens for web traffic
EXPOSE 80

# 4. Command to run the Nginx server
# This is the standard command to keep Nginx running in the container
CMD ["nginx", "-g", "daemon off;"]
