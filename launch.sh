#!/bin/bash

echo "Launching Application ..."

export NODE_ENV=production
export PORT=9000


pm2 start ./dist/server/app.js -i 1

echo "Scaling server ..."

pm2 scale app 2
