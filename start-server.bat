@echo off
cd /d "%~dp0"
start "" http://localhost:3002
node server.js 3002
