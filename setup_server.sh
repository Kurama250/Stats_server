#!/bin/bash
# setup_server by Kurama250
# Github : https://github.com/Kurama250

apt update && apt upgrade -y
apt install npm nodejs git -y
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - &&\
    apt-get install -y nodejs -y
else
    echo "Node.js is already installed. Skipping installation."
fi
git clone https://github.com/Kurama250/Stats_server.git
cd Stats_server/
npm install discord.js@13 child_process
npm install pm2 -g
