/*
Created by Kurama
Github: https://github.com/Kurama250
*/

const { Client, Intents, MessageEmbed } = require('discord.js');
const { exec } = require('child_process');
const os = require('os');

const client = new Client({
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES]
});

const config = require('./config.json');
const { token, channelId, serverId } = config;

let message = null;

client.on('ready', () => {
  console.log(`Bot ${client.user.tag} is start !`);
  startUpdatingStats();
});

client.login(token);

function getSystemStats(callback) {
  exec('top -bn1 | grep Cpu', (error, cpuOutput) => {
    if (error) {
      console.error(`Error executing top : ${error.message}`);
      return callback(error);
    }

    exec('free -m | grep Mem', (error, memOutput) => {
      if (error) {
        console.error(`Error executing free : ${error.message}`);
        return callback(error);
      }

      exec('df -h --output=pcent / | tail -1', (error, diskOutput) => {
        if (error) {
          console.error(`Error executing df : ${error.message}`);
          return callback(error);
        }

        exec('sensors', (error, tempOutput) => {
          if (error) {
            console.error(`Error executing sensors : ${error.message}`);
            return callback(error);
          }

          const CpuUsage = parseCpuUsage(cpuOutput);
          const RamUsage = parseMemoryUsage(memOutput);
          const StorageUsage = parseStorageUsage(diskOutput);
          const Temperature = parseTemperature(tempOutput);

          const stats = {
            CpuUsage,
            RamUsage,
            StorageUsage,
            Temperature
          };

          callback(null, stats);
        });
      });
    });
  });
}

function parseCpuUsage(cpuOutput) {
  if (!cpuOutput) {
    return 'N/A';
  }

  const cpuParts = cpuOutput.split(/\s+/);
  const CpuUsage = cpuParts[1];

  return CpuUsage;
}

function parseMemoryUsage(memOutput) {
  if (!memOutput) {
    return 'N/A';
  }

  const memParts = memOutput.split(/\s+/);
  const totalMem = parseFloat(memParts[1]);
  const usedMem = parseFloat(memParts[2]);
  const RamUsage = ((usedMem / totalMem) * 100).toFixed(2);

  return RamUsage;
}

function parseStorageUsage(diskOutput) {
  if (!diskOutput) {
    return 'N/A';
  }

  const StorageUsage = diskOutput.trim();

  return StorageUsage;
}

function parseTemperature(tempOutput) {
  try {
    if (!tempOutput) {
      console.error('Temperature output is empty.');
      return 'N/A';
    }

    const adapterKeywords = {
      'jc42-i2c-0-18': 'temp1',
      'k10temp-pci-00c3': 'Tctl',
      'jc42-i2c-0-19': 'temp1',
      'nct6795-isa-0a20': 'SYSTIN'
    };

    const adapter = Object.keys(adapterKeywords).find(key => tempOutput.includes(key));
    
    if (!adapter) {
      console.error('No matching adapter found in temperature output :', tempOutput);
      return 'N/A';
    }

    const temperatureLine = tempOutput.split('\n').find(line => line.includes(adapterKeywords[adapter]));

    if (!temperatureLine) {
      console.error('Temperature line not found in output for adapter :', adapter);
      return 'N/A';
    }

    const temperatureParts = temperatureLine.split(/\s+/);

    if (temperatureParts.length < 2) {
      console.error('Invalid temperature line format :', temperatureLine);
      return 'N/A';
    }

    const temperature = temperatureParts[1];

    return temperature || 'N/A';
  } catch (error) {
    console.error('Error parsing temperature :', error);
    return 'N/A';
  }
}

async function updateStats() {
  const serverName = os.hostname();
  const osInfo = `${os.type()} ${os.release()}`;
  const embed = new MessageEmbed().setTitle(`Stats for : **${serverName} (${osInfo})**`);
  const stats = await new Promise((resolve, reject) => {
    getSystemStats((error, result) => {
      if (error) {
        reject(error);
      } else {
        resolve(result);
      }
    });
  });

  embed.setDescription('**------------------------ Server Stats -----------------------**');
  embed.setThumbnail('https://raw.githubusercontent.com/Kurama250/Stats_server/main/img/linux.png')
  embed.setColor('BLUE');

  embed.addFields(
    { name: 'CPU Usage', value: `${stats.CpuUsage}%`, inline: true },
    { name: 'Memory Usage', value: `${stats.RamUsage}%`, inline: true },
    { name: 'Disk Usage', value: `${stats.StorageUsage}`, inline: true },
    { name: 'Temperature', value: `${stats.Temperature}`, inline: true }
  );

  const guild = await client.guilds.fetch(serverId);
  if (!guild) {
    console.log(`Error server ID : ${serverId}`);
    return;
  }

  const channel = await guild.channels.fetch(channelId);
  if (!channel) {
    console.log(`Error channel ID : ${channelId}`);
    return;
  }

  if (message) {
    message.edit({ embeds: [embed] }).catch((error) => {
      console.log('Error editing message :', error);
    });
  } else {
    message = await channel.send({ embeds: [embed] }).catch((error) => {
      console.log('Error sending message :', error);
    });
  }
}

function startUpdatingStats() {
  setInterval(updateStats, 10000);
}
