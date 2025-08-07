const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const identityManager = require('../../utils/identityManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('saveidentity')
        .setDescription('Enregistrer une nouvelle identité personnalisée.')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('Le nom de l\'identité à enregistrer')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('avatarurl')
                .setDescription('URL de l\'avatar pour cette identité')
                .setRequired(true)),
    async execute(interaction) {
        const { blacklist } = require('../../config.json');
        if (blacklist && blacklist.includes(interaction.user.id)) {
            await interaction.reply({
                content: `⛔ Vous êtes exclu de l'utilisation de cette commande.`,
                flags: MessageFlags.Ephemeral
            });
            return;
        }

        const name = interaction.options.getString('name');
        const avatarUrl = interaction.options.getString('avatarurl');
        const userId = interaction.user.id;

        // Validation du nom (pas d'espaces en début/fin, longueur raisonnable)
        const trimmedName = name.trim();
        if (trimmedName.length === 0) {
            await interaction.reply({
                content: `❌ Le nom de l'identité ne peut pas être vide.`,
                flags: MessageFlags.Ephemeral
            });
            return;
        }

        if (trimmedName.length > 32) {
            await interaction.reply({
                content: `❌ Le nom de l'identité ne peut pas dépasser 32 caractères.`,
                flags: MessageFlags.Ephemeral
            });
            return;
        }

        // Validation basique de l'URL
        try {
            new URL(avatarUrl);
        } catch (error) {
            await interaction.reply({
                content: `❌ L'URL de l'avatar n'est pas valide.`,
                flags: MessageFlags.Ephemeral
            });
            return;
        }

        // Vérification que l'URL mène bien vers une image valide
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        
        const isValidImage = await identityManager.validateAvatarUrl(avatarUrl);
        if (!isValidImage) {
            await interaction.editReply({
                content: `❌ L'URL fournie ne mène pas vers une image valide ou n'est pas accessible.`
            });
            return;
        }

        try {
            await identityManager.addIdentity(userId, trimmedName, avatarUrl);
            await interaction.editReply({
                content: `✅ Identité "${trimmedName}" enregistrée avec succès !`
            });
        } catch (error) {
            console.error('Erreur lors de l\'enregistrement de l\'identité:', error);
            await interaction.editReply({
                content: `❌ ${error.message}`
            });
        }
    },
};
