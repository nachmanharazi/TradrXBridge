@echo off
setlocal enabledelayedexpansion

echo Testing Docker output at %TIME% > docker-test-output.txt
echo ======================================== >> docker-test-output.txt
echo.

echo 1. Testing basic Docker command...
docker --version >> docker-test-output.txt 2>&1
echo [%TIME%] Basic Docker command completed. >> docker-test-output.txt
echo.

echo 2. Testing Alpine Linux container...
docker run --rm alpine:3.18 echo "Hello from Alpine Linux" >> docker-test-output.txt 2>&1
echo [%TIME%] Alpine test completed. >> docker-test-output.txt
echo.

echo 3. Testing Node.js version...
docker run --rm node:20-alpine node -v >> docker-test-output.txt 2>&1
echo [%TIME%] Node.js version test completed. >> docker-test-output.txt
echo.

echo 4. Testing file creation in container...
docker run --rm -v "%CD%:/app" -w /app node:20-alpine sh -c "echo 'Test file content' > test-file.txt" >> docker-test-output.txt 2>&1
echo [%TIME%] File creation test completed. >> docker-test-output.txt
echo.

if exist test-file.txt (
    echo [SUCCESS] Test file was created. >> docker-test-output.txt
    type test-file.txt >> docker-test-output.txt
) else (
    echo [ERROR] Test file was not created. >> docker-test-output.txt
)

echo.
echo ======================================== >> docker-test-output.txt
echo Test completed at %TIME% >> docker-test-output.txt
echo.

echo Test completed. Check docker-test-output.txt for results.
