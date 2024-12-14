#!/bin/bash
# setup.sh by Kurama250
# Github : https://github.com/Kurama250/

apt update && apt upgrade -y
apt install npm nodejs git lm-sensors -y

if ! command -v node &> /dev/null; then
    echo "Node.js is not installed. Installing..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
else
    echo "Node.js is already installed. Skipping installation."
fi

git clone https://github.com/Kurama250/Stats_server.git
cd Stats_server/
npm install discord.js@13 child_process os

if ! command -v pm2 &> /dev/null; then
    echo "PM2 is not installed. Installing..."
    npm install pm2 -g
else
    echo "PM2 is already installed. Skipping installation."
fi
