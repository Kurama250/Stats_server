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
    if (error) return callback(error);
    exec('free -m | grep Mem', (error, memOutput) => {
      if (error) return callback(error);
      exec('df -h --output=pcent / | tail -1', (error, diskOutput) => {
        if (error) return callback(error);
        exec('sensors || echo "N/A"', (error, tempOutput) => {
          const stats = {
            CpuUsage: parseCpuUsage(cpuOutput),
            RamUsage: parseMemoryUsage(memOutput),
            StorageUsage: parseStorageUsage(diskOutput),
            Temperature: parseTemperature(tempOutput)
          };
          callback(null, stats);
        });
      });
    });
  });
}

function parseCpuUsage(cpuOutput) {
  return cpuOutput ? cpuOutput.split(/\s+/)[1] : 'N/A';
}

function parseMemoryUsage(memOutput) {
  if (!memOutput) return 'N/A';
  const [_, totalMem, usedMem] = memOutput.split(/\s+/).map(parseFloat);
  return ((usedMem / totalMem) * 100).toFixed(2);
}

function parseStorageUsage(diskOutput) {
  return diskOutput ? diskOutput.trim() : 'N/A';
}

function parseTemperature(tempOutput) {
  if (!tempOutput || tempOutput.includes('No sensors found')) return 'N/A';
  const match = tempOutput.match(/\+([0-9]+\.[0-9])°C/);
  return match ? `${match[1]}°C` : 'N/A';
}

async function updateStats() {
  const serverName = os.hostname();
  const osInfo = `${os.type()} ${os.release()}`;
  const embed = new MessageEmbed()
    .setTitle(`Stats for : **${serverName} (${osInfo})**`)
    .setDescription('**------------------------ Server Stats -----------------------**')
    .setThumbnail('https://raw.githubusercontent.com/Kurama250/Stats_server/main/img/linux.png')
    .setColor('PURPLE');

  const stats = await new Promise((resolve, reject) => {
    getSystemStats((error, result) => (error ? reject(error) : resolve(result)));
  });

  embed.addFields(
    { name: 'CPU Usage', value: `${stats.CpuUsage}%`, inline: true },
    { name: 'Memory Usage', value: `${stats.RamUsage}%`, inline: true },
    { name: 'Disk Usage', value: `${stats.StorageUsage}`, inline: true },
    { name: 'Temperature', value: `${stats.Temperature}`, inline: true }
  );

  const guild = await client.guilds.fetch(serverId);
  if (!guild) return;
  const channel = await guild.channels.fetch(channelId);
  if (!channel) return;

  if (message) {
    message.edit({ embeds: [embed] }).catch(console.error);
  } else {
    message = await channel.send({ embeds: [embed] }).catch(console.error);
  }
}

function startUpdatingStats() {
  setInterval(updateStats, 10000);
}
