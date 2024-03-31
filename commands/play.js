const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
const { Player, QueryType } = require("discord-player");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("play")
        .setDescription("Play a song from YouTube.")
        .addSubcommand(subcommand =>
            subcommand
                .setName("search")
                .setDescription("Searches for a song and plays it")
                .addStringOption(option =>
                    option.setName("searchterms").setDescription("Search keywords").setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("playlist")
                .setDescription("Plays a playlist from YouTube")
                .addStringOption(option => option.setName("url").setDescription("The playlist's URL").setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("song")
                .setDescription("Plays a single song from YouTube")
                .addStringOption(option => option.setName("url").setDescription("The song's URL").setRequired(true))
        ),
    execute: async ({ client, interaction }) => {
        // Make sure the user is inside a voice channel
        if (!interaction.member.voice.channel) return interaction.reply("You need to be in a voice channel to play a song.");

        // Create a play queue for the server
        const player = new Player(client);
        let queue = player.getQueue(interaction.guild.id);

        // If there's no queue, create one
        if (!queue) {
            queue = player.createQueue(interaction.guild, {
                metadata: {
                    channel: interaction.channel
                }
            });
        }

        let embed = new MessageEmbed();

        if (interaction.options.getSubcommand() === "song") {
            let url = interaction.options.getString("url");
            
            // Search for the song using the discord-player
            const result = await player.search(url, {
                requestedBy: interaction.user,
                searchEngine: "youtube"
            });

            // Finish if no tracks were found
            if (!result || !result.tracks.length)
                return interaction.reply("No results");

            // Add the track to the queue
            const song = result.tracks[0];
            queue.addTrack(song);
            embed
                .setDescription(`**[${song.title}](${song.url})** has been added to the queue`)
                .setThumbnail(song.thumbnail)
                .setFooter({ text: `Duration: ${song.duration}`});
        }
        ///////////////////////////////////////////////////////
        else if (interaction.options.getSubcommand() === "playlist") {

            // Search for the playlist using the discord-player
            let url = interaction.options.getString("url")
            const result = await client.player.search(url, {
                requestedBy: interaction.user,
                searchEngine: QueryType.YOUTUBE_PLAYLIST
            })

            if (result.tracks.length === 0)
                return interaction.reply(`No playlists found with ${url}`)
            
            // Add the tracks to the queue
            const playlist = result.playlist
            await queue.addTracks(result.tracks)
            embed
                .setDescription(`**${result.tracks.length} songs from [${playlist.title}](${playlist.url})** have been added to the Queue`)
                .setThumbnail(playlist.thumbnail)

        } 
        else if (interaction.options.getSubcommand() === "search") {

            // Search for the song using the discord-player
            let url = interaction.options.getString("searchterms")
            const result = await client.player.search(url, {
                requestedBy: interaction.user,
                searchEngine: QueryType.AUTO
            })

            // finish if no tracks were found
            if (result.tracks.length === 0)
                return interaction.editReply("No results")
            
            // Add the track to the queue
            const song = result.tracks[0]
            await queue.addTrack(song)
            embed
                .setDescription(`**[${song.title}](${song.url})** has been added to the Queue`)
                .setThumbnail(song.thumbnail)
                .setFooter({ text: `Duration: ${song.duration}`})
        }

        // Play the song
        if (!queue.playing) await queue.play()
        
        // Respond with the embed containing information about the player
        await interaction.reply({
            embeds: [embed]
        })
    },
}
