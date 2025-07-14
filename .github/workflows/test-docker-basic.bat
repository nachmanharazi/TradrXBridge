@echo off
echo Testing basic Docker functionality...
echo ====================================
echo.

echo 1. Checking Docker version:
docker --version
echo.

echo 2. Listing running containers:
docker ps
echo.

echo 3. Listing all containers (including stopped):
docker ps -a
echo.

echo 4. Checking Docker system info (basic):
docker info --format "{{.ServerVersion}}"
echo.

echo 5. Testing simple container:
docker run --rm -it --name test-container alpine:3.18 echo "Hello from test container"
echo.

echo ====================================
echo Test complete.
