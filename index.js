"use strict";

const Eris = require("eris");
const fs = require("node:fs");

const { getMCData } = require("./common/Util.js");
const Embed = require("./classes/Embed.js");

const config = require("./ext/config.json");

getMCData();
require("./common/ProtocolReplacement.js");

const token = config.isBeta ? config.beta_token : config.prod_token;

const client = new Eris(token, {
  options: {
    intents: [
      "all"
    ],
    disable_events: [
      "CHANNEL_CREATE",
      "CHANNEL_DELETE",
      "CHANNEL_UPDATE",
      "GUILD_BAN_ADD",
      "GUILD_BAN_REMOVE",
      "GUILD_DELETE",
      "GUILD_MEMBER_ADD",
      "GUILD_MEMBER_REMOVE",
      "GUILD_MEMBER_UPDATE",
      "GUILD_ROLE_CREATE",
      "GUILD_ROLE_DELETE",
      "GUILD_ROLE_UPDATE",
      "GUILD_UPDATE",
      "MESSAGE_CREATE",
      "MESSAGE_DELETE",
      "MESSAGE_DELETE_BULK",
      "MESSAGE_UPDATE",
      "PRESENCE_UPDATE",
      "TYPING_START",
      "USER_UPDATE",
      "VOICE_STATE_UPDATE"
    ],
    maxShards: "auto"
  }
});

module.exports = {
  client
};

const eventFiles = fs.readdirSync("./events/");

for (let i = 0; i < 2; i++) require(`./events/${eventFiles[i]}`);

client.commands = new Map();

fs.readdirSync("./commands", { withFileTypes: true }).forEach(folder => {
  if (folder.name === "unused") return;

    fs.readdirSync(`./commands/${folder.name}`).forEach(file => {
      try {
        const command = require(`./commands/${folder.name}/${file}`);
    
        if (!command.disabled) client.commands.set(command.name, command);
      } catch (error) {
        console.error(`Unable to load command: ${folder.name}/${file}.\n\nStack: ${error.stack}`);
        process.exit(1);
      }
    })
});

let embed = new Embed()

client.on("error", (error) => {
  if (error.code === 1006 || error.code === 1001) return;

  console.error(error);

  embed.description = `\`\`${error}\`\``;

  client.createMessage(config.error_log_channel, { embed });
});

client.on("debug", (msg) => console.log(`[DEBUG] ${msg}`));

process.on("warning", (warning) => {
  console.warn(warning);

  embed.description = `\`\`${warning}\`\``;

  client.createMessage(config.error_log_channel, { embed });
});

process.on("unhandledRejection", (error) => {
  if ([10062, 50001, 10003].includes(error?.code) || error?.stack.includes("Authentication failed, timed out")) return;
  if (error?.stack.includes("Failed to set remote answer sdp: Called in wrong state: stable")) return;

  embed.description = `\`\`${error}\`\``;

  client.createMessage(config.error_log_channel, { embed });

  console.error(error);
});

process.on("uncaughtException", (error) => {
  console.error(error);

  embed.description = `\`\`${error}\`\``;

  client.createMessage(config.error_log_channel, { embed });

  process.exit(0);
});

client.connect();

setTimeout(() => {
  console.log("Restarting...")

  process.exit(0)
}, 86400000) // 24 hours, exit to prevent freezing, temporary solution