const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const identityManager = require('../../utils/identityManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('deleteidentity')
        .setDescription('Supprimer une identité enregistrée.')
        .addStringOption(option =>
            option.setName('character')
                .setDescription('Le nom de l\'identité à supprimer')
                .setRequired(true)
                .setAutocomplete(true)),
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

        const characterName = interaction.options.getString('character');
        try {
            // Vérifier que l'identité existe
            const identity = await identityManager.getIdentity(characterName);
            if (!identity) {
                await interaction.reply({
                    content: `❌ Aucune identité trouvée avec le nom "${characterName}".`,
                    flags: MessageFlags.Ephemeral
                });
                return;
            }

            // Supprimer l'identité
            const deleted = await identityManager.deleteIdentity(characterName);
            if (deleted) {
                await interaction.reply({
                    content: `✅ L'identité "${characterName}" a été supprimée avec succès.`,
                    flags: MessageFlags.Ephemeral
                });
            } else {
                await interaction.reply({
                    content: `❌ Erreur lors de la suppression de l'identité "${characterName}".`,
                    flags: MessageFlags.Ephemeral
                });
            }
        } catch (error) {
            console.error('Erreur lors de la suppression de l\'identité:', error);
            await interaction.reply({
                content: `❌ Erreur lors de la suppression de l'identité.`,
                flags: MessageFlags.Ephemeral
            });
        }
    },
};
