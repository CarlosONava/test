const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits, Collection } = require('discord.js');
const axios = require('axios');
const fs = require('fs');

// Cache file path
const CACHE_FILE = './leaderboardCache.json';

// Allowed channel ID (replace with your channel ID)
const ALLOWED_CHANNEL_ID = '1274808092923793521';

// Fun footer messages
const footerMessages = [
    "`gang reigns on top`",
    "1imag is SSS+++",
    "Your_Lucky is SSS+++",
    "I might leak the whole source code of utg",
    "ssssigma sssociety",
    "SSWAAAGGG MESSSSAIAH"
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leadersboad')
        .setDescription('display the `gang leaderboard')
        .addBooleanOption(option =>
            option.setName('force_refresh')
                .setDescription('Force a refresh of the leaderboard data')
                .setRequired(false)),
    async execute(interaction) {
        // Check if the command is used in the allowed channel
        if (interaction.channelId !== ALLOWED_CHANNEL_ID) {
            return interaction.reply({ content: "wrong channel, nice spam attempt buddy.", ephemeral: true });
        }

        // Initialize cooldowns if not exists
        if (!interaction.client.cooldowns) {
            interaction.client.cooldowns = new Collection();
        }
        const cooldowns = interaction.client.cooldowns;

        if (!cooldowns.has('leadersboad')) {
            cooldowns.set('leadersboad', new Collection());
        }

        const now = Date.now();
        const timestamps = cooldowns.get('leadersboad');
        const cooldownAmount = 30 * 1000; // 30 seconds cooldown

        if (timestamps.has(interaction.user.id)) {
            const expirationTime = timestamps.get(interaction.user.id) + cooldownAmount;
            if (now < expirationTime) {
                const timeLeft = (expirationTime - now) / 1000;
                return interaction.reply({ content: `Please wait ${timeLeft.toFixed(1)} more seconds before using the \`leadersboad\` command again.`, ephemeral: true });
            }
        }

        await interaction.deferReply();

        try {
            let leaderboardData;
            const forceRefresh = interaction.options.getBoolean('force_refresh') || false;

            if (forceRefresh && interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
                leaderboardData = await fetchLeaderboardData();
            } else {
                leaderboardData = await getCachedOrFetchLeaderboardData();
            }

            const pages = createLeaderboardPages(leaderboardData);
            let currentPage = 0;

            const embed = createEmbed(pages[currentPage], currentPage);
            const row = createButtonRow();

            const response = await interaction.editReply({ embeds: [embed], components: [row] });

            const collector = response.createMessageComponentCollector({ 
                filter: i => i.user.id === interaction.user.id,
                time: 600000 // 10 minutes
            });

            collector.on('collect', async i => {
                if (i.customId === 'previous') {
                    currentPage = currentPage > 0 ? currentPage - 1 : pages.length - 1;
                } else if (i.customId === 'next') {
                    currentPage = currentPage < pages.length - 1 ? currentPage + 1 : 0;
                }

                const newEmbed = createEmbed(pages[currentPage], currentPage);
                await i.update({ embeds: [newEmbed], components: [row] });
            });

            collector.on('end', () => {
                interaction.editReply({ components: [] });
            });

            // Set cooldown
            timestamps.set(interaction.user.id, now);
            setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);

        } catch (error) {
            console.error('Error in leaderboard command:', error);
            await interaction.editReply('Itss fucked up the leaders boad again. Try again later.');
        }
    }
};

async function fetchLeaderboardData() {
    try {
        const response = await axios.get('https://sheetdb.io/api/v1/tgcy68j824b7m');
        const rawData = response.data;
        
        // Skip the header row and process the data
        const data = rawData.map((row) => ({
            Name: row.Name,
            Rank: `#${row.Rank}`,
            Letter: row.Letter
        }));

        const cache = { data, timestamp: Date.now() };
        fs.writeFileSync(CACHE_FILE, JSON.stringify(cache));
        return data;
    } catch (error) {
        console.error('Error fetching leaderboard data:', error);
        return [];
    }
}

async function getCachedOrFetchLeaderboardData() {
    if (fs.existsSync(CACHE_FILE)) {
        const cache = JSON.parse(fs.readFileSync(CACHE_FILE));
        const cacheAge = Date.now() - cache.timestamp;
        if (cacheAge < 24 * 60 * 60 * 1000) { // 24 hours
            return cache.data;
        }
    }
    return fetchLeaderboardData();
}

function createLeaderboardPages(data) {
    const pages = [];
    for (let i = 0; i < 5; i++) {
        const pageData = data.slice(i * 10, (i + 1) * 10);
        while (pageData.length < 10) {
            pageData.push({ Name: 'UTGIAN', Rank: `#${i * 10 + pageData.length + 1}`, Letter: 'C' });
        }
        pages.push(pageData);
    }
    return pages;
}

function formatLeaderboardData(data, pageNumber) {
    return data.map((entry, index) => {
        const globalIndex = pageNumber * 10 + index;
        let prefix = entry.rank || `#${globalIndex + 1}`;
        
        if (globalIndex === 0) prefix = '🥇 ' + prefix;
        else if (globalIndex === 1) prefix = '🥈 ' + prefix;
        else if (globalIndex === 2) prefix = '🥉 ' + prefix;
        
        const Name = entry.Name || 'UTGIAN';
        const Letter = entry.Letter || 'C';
        
        return `${prefix} ${Name}, ${Letter}`;
    }).join('\n');
}

function createEmbed(pageData, pageNumber) {
    const embed = new EmbedBuilder()
        .setTitle('**leaders boad**')
        .setColor(getPageColor(pageNumber))
        .setDescription(formatLeaderboardData(pageData, pageNumber))
        .setFooter({ text: footerMessages[Math.floor(Math.random() * footerMessages.length)] })
        .setTimestamp();
    return embed;
}

function getPageColor(pageNumber) {
    const colors = ['#FFD700', '#EEC900', '#CDAA00', '#B8860B', '#8B6914'];
    return colors[pageNumber];
}

function createButtonRow() {
    return new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('previous')
                .setLabel('Previous')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('next')
                .setLabel('Next')
                .setStyle(ButtonStyle.Primary)
        );
}