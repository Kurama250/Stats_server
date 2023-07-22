#!/bin/bash
# setup_server by Kurama250
# Github : https://github.com/Kurama250

apt update && apt upgrade -y
apt install npm node.js zip -y
curl -fsSL https://deb.nodesource.com/setup_16.x | bash - &&\
apt-get install -y nodejs -y
npm install discord.js@13 child_process
npm install pm2 -g