const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('dontusethiscommand')
        .setDescription('dont use this command'),
    async execute(interaction, client) {
        // Correct initialization of the embed
        const embed = new EmbedBuilder()
            .setTitle('Man, how many hoes we got?')
            .setDescription('Tons, on buckets, shakin they ...')
            .setColor(0xffffff)
            .setImage(client.user.displayAvatarURL())
            .setThumbnail(client.user.displayAvatarURL())  // `bannerURL` is often undefined for a user
            .setTimestamp(Date.now())
            .setAuthor({
                url: 'https://youtube.com/@1imag337',
                iconURL: interaction.user.displayAvatarURL(),
                name: interaction.user.tag
            })
            .setFooter({
                iconURL: client.user.displayAvatarURL(),
                text: 'vandori is a bum'
            })
            .setURL('https://www.roblox.com/games/14780588200/powers-feet-hangout')
            .addFields(
                { name: '"See what im missin?"', value: 'yeah, let me have some of that', inline: true },
                { name: 'leadersboad', value: 'is better than settings boad', inline: true }
            );

        // Replying with the embed
        await interaction.reply({
            embeds: [embed]
        });
    },
};
