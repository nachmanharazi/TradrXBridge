@echo off
echo Testing container output and file creation...

:: Test 1: Simple echo command
echo.
echo Test 1: Running simple echo command...
docker run --rm -it alpine:3.18 echo "This is a test from container"

:: Test 2: Create a file in the container
echo.
echo Test 2: Creating a file in the container...
docker run --rm -v "%CD%:/app" -w /app alpine:3.18 sh -c "echo 'Test file content' > container-test.txt"

:: Check if file was created
echo.
if exist container-test.txt (
    echo File was created successfully. Contents:
    type container-test.txt
) else (
    echo ERROR: File was not created.
)

echo.
echo Test complete.
