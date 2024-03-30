const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
const { QueryType } = require("discord-player");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("play")
        .setDescription("playing a song")
        .addSubcommand(addSubcommand => {
            addSubcommand
                .setName("search")
                .setDescription("search for a song")
                .addStringOption(option => {
                    option
                        .setName("searchterms")
                        .setDescription("search keywords")
                        .setRequired(true);
                })
        })
        .addSubcommand(subcommand => {
            subcommand
                .setName("playlist")
                .setDescription("play playlist")
                .addStringOption(option => {
                    option
                        .setName("url")
                        .setDescription("playlist link")
                        .setRequired(true);
                })
        })
        .addSubcommand(subcommand => {
            subcommand
                .setName("song")
                .setDescription("plays song")
                .addStringOption(option => {
                    option
                        .setName("url")
                        .setDescription("link of song")
                        .setRequired(true);
                })
        }),
    execute: async ({ client, interaction }) => {
        if (!interaction.memeber.voice.channel) {
            await interaction.reply("you must be in a voice channel to use this command/debes de estar en un canal de voz para use este comando")
            return;
        }
        const queue = await client.player.createQueue(interation.guild);
        if (!queue.connection) await queue.connect(interaction.memeber.voice.channel)

        let embed = new MessageEmbed();
        if (interaction.options.getSubcommand() === "song") {
            let url = interaction.options.getString("url");
            const result = await client.player.search(url, {
                requestBy: interaction.user,
                searchEngine: QueryType.YOUTUBE_VIDEO,
            });

            if (result.tracks.length === 0) {
                await interaction.reply("no results found/no se encontraron resultados");
                return
            }

            const song = result.tracks[0]
            await queue.addTrack(song);

            embed
                .setDescription(`Added --[${song.title}](${song.url})-- to the queue`)
                .setThumbnail(song.thumbnail)
                .setFooter({ text: `Duration: ${song.duration}` });
            //})
        }

        else if (interaction.options.getSubcommand() === "playlist") {
            let url = interaction.options.getString("url");
            const result = await client.player.search(url, {
                requestBy: interaction.user,
                searchEngine: QueryType.YOUTUBE_PLAYLIST,
            });

            if (result.tracks.length === 0) {
                await interaction.reply("no results found/no se encontraron resultados");
                return
            }

            const playlist = result.playlist
            await queue.addTracks(playlist);

            embed
                .setDescription(`Added --[${playlist.title}](${playlist.url})-- to the queue`)
                .setThumbnail(playlist.thumbnail)
                .setFooter({ text: `Duration: ${playlist.duration}` });
        }

        else if (interaction.options.getSubcommand() === "searchterms") {
            let url = interaction.options.getString("url");
            const result = await client.player.search(url, {
                requestBy: interaction.user,
                searchEngine: QueryType.AUTO,
            });

            if (result.tracks.length === 0) {
                await interaction.reply("no results found/no se encontraron resultados");
                return
            }

            const song = result.tracks[0]
            await queue.addTracks(song);

            embed
                .setDescription(`Added --[${song.title}](${song.url})-- to the queue`)
                .setThumbnail(song.thumbnail)
                .setFooter({ text: `Duration: ${song.duration}` });
        }

        if (!queue.playing) await queue.play();

        await interaction.reply({
            embeds: [embed]
        })

    }

}