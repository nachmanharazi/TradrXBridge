@echo off
echo Testing Docker volume mounts...
echo ===============================

:: Create a test directory
mkdir test-volume 2>nul
cd test-volume

echo Creating test file...
echo This is a test file > test-file.txt

echo Running Docker container with volume mount...
docker run --rm -v "%CD%:/app" -w /app alpine:3.18 sh -c "ls -la && echo '---' && cat test-file.txt && echo '---' && echo 'Adding line from container' >> test-file.txt"

echo.
echo Contents of test-file.txt after container run:
type test-file.txt

echo.
echo ===============================
echo Test complete. Check if the file was modified by the container.
