@echo off
start cmd /k redis-server redis.conf && node ./serve.js insecure
