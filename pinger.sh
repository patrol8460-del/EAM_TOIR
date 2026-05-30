#!/bin/bash
while true; do
  curl -s -o /dev/null --connect-timeout 2 --max-time 3 http://localhost:3000/ > /dev/null 2>&1
  sleep 3
done
