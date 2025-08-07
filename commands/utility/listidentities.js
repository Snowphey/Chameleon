const { SlashCommandBuilder, MessageFlags, EmbedBuilder } = require('discord.js');
const identityManager = require('../../utils/identityManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('listidentities')
        .setDescription('Lister toutes les identités enregistrées.'),
    async autocomplete(interaction) {
        const focusedValue = interaction.options.getFocused();
        try {
            const identityNames = await identityManager.getAllIdentityNames();
            const filtered = identityNames.filter(name => 
                name.toLowerCase().includes(focusedValue.toLowerCase())
            ).slice(0, 25);

            await interaction.respond(
                filtered.map(name => ({ name: name, value: name }))
            );
        } catch (error) {
            console.error('Erreur lors de l\'autocomplétion:', error);
            await interaction.respond([]);
        }
    },
    async execute(interaction) {
        const { blacklist } = require('../../config.json');
        if (blacklist && blacklist.includes(interaction.user.id)) {
            await interaction.reply({
                content: `⛔ Vous êtes exclu de l'utilisation de cette commande.`,
                flags: MessageFlags.Ephemeral
            });
            return;
        }

        try {
            // Lister les identités globales
            const identities = await identityManager.getAllIdentities();
            if (identities.length === 0) {
                await interaction.reply({
                    content: `📝 Aucune identité enregistrée sur le serveur. Utilisez "/saveidentity" pour en créer une.`,
                    flags: MessageFlags.Ephemeral
                });
                return;
            }

            const embed = new EmbedBuilder()
                .setTitle('🎭 Identités du serveur')
                .setColor(0x00AE86)
                .setDescription(`Il y a ${identities.length} identité(s) enregistrée(s) :`)
                .setFooter({ text: 'Utilisez /saycharacter pour les utiliser ou /deleteidentity pour en supprimer une.' });
            identities.forEach((identity, index) => {
                embed.addFields({
                    name: `${index + 1}. ${identity.name}`,
                    value: `Créée le ${new Date(identity.created_at).toLocaleDateString('fr-FR')}`,
                    inline: true
                });
            });

            await interaction.reply({
                embeds: [embed],
                flags: MessageFlags.Ephemeral
            });
        } catch (error) {
            console.error('Erreur lors de la récupération des identités:', error);
            await interaction.reply({
                content: `❌ Erreur lors de la récupération des identités.`,
                flags: MessageFlags.Ephemeral
            });
        }
    },
};
