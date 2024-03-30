require("dotenv").config();

const {REST} = require("@discordjs/rest");
const { Routes } = require("@discord-api-types/v9");
const { Client, Intents, Collection } = require("discord.js");
const { Player } = require("discord-player");

const fs = require("node:fs");
const path = require("node:path");

const client = new Client ({
    intents: [Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_VOICE_STATES]
});

//commands
const commands = [];
client.commands = new Collection();

const commandsPath = path.join(__dirname, "commands");
const commandsFiles = fs.readdir(commandsPath).filter(file => file.endsWith(".js"));

for (const file of commandsFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    client.commands.set(command.data.name, command);
    commands.push(command);
}

//player
client.player = new Player(client, {
    ytdlOptions: {
        quality: "highestaudio",
        highWatermark: 1 << 25
    }
});

//get identifaction
client.on("ready", () => {
    const guild_ids = client.guilds.cache.map(guild => guild.id);
    const rest = new REST({version: "9"}).setToken(process.env.TOKEN);
    for (const guildId of guild_ids) {
        rest.put(Routes.applicationGuildCommands(procces.env.CLIENT_ID, guildId),
        {body: commands})
        .then(() => console.log(`Added commands to ${guildId}`))
        .catch(console.error);
    }
})

//interaction
client.on("interactionCreate", async interaction => {
    if (!interaction.isCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if (!command) return;

    try {
        await command.execute({client, interaction});
    } catch(err) {
        console.error(err);
        await interacition.reply("An error ocurred while executing the command");
    }
});

client.login(procces.env.TOKEN);
