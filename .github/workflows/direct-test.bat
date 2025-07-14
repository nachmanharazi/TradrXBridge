@echo off
echo Testing Docker output...

echo Running simple echo command in container:
docker run --rm alpine:3.18 echo "Hello from Alpine Linux"

echo.
echo Running Node.js version check:
docker run --rm node:20-alpine node -v

echo.
echo Running simple Node.js script:
docker run --rm node:20-alpine node -e "console.log('Test output from Node.js'); console.error('Test error output');"

echo.
echo Test complete.
