const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const identityManager = require('../../utils/identityManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('saycustom')
        .setDescription('Envoyer un message en personnalisant le pseudo et l\'avatar.')
        .addStringOption(option =>
            option.setName('displayname')
                .setDescription('Le nom à afficher')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('avatarurl')
                .setDescription('URL de l\'avatar à utiliser')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('message')
                .setDescription('Le message à envoyer')
                .setRequired(true))
        .addBooleanOption(option =>
            option.setName('preview')
                .setDescription('Prévisualiser le message avant envoi')),
    async execute(interaction) {
        const { blacklist } = require('../../config.json');
        if (blacklist && blacklist.includes(interaction.user.id)) {
            await interaction.reply({
                content: `⛔ Vous êtes exclu de l'utilisation de cette commande.`,
                flags: MessageFlags.Ephemeral
            });
            return;
        }

        const displayName = interaction.options.getString('displayname');
        const avatarURL = interaction.options.getString('avatarurl');
        let message = interaction.options.getString('message');
        const channel = interaction.channel;
        const preview = interaction.options.getBoolean('preview');

        // Validation basique de l'URL
        try {
            new URL(avatarURL);
        } catch (error) {
            await interaction.reply({
                content: `❌ L'URL de l'avatar n'est pas valide.`,
                flags: MessageFlags.Ephemeral
            });
            return;
        }

        // Vérification que l'URL mène bien vers une image valide
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        
        const isValidImage = await identityManager.validateAvatarUrl(avatarURL);
        if (!isValidImage) {
            await interaction.editReply({
                content: `❌ L'URL fournie ne mène pas vers une image valide ou n'est pas accessible.`
            });
            return;
        }

        // Remplacer les séquences '\n' par des vrais retours à la ligne
        message = message.replace(/\\n/g, '\n');

        
        if (preview) {
            const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
            const embed = new EmbedBuilder()
                .setAuthor({ name: displayName, iconURL: avatarURL })
                .setDescription(message)
                .setColor(0x2F3136);

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('say_confirm')
                    .setLabel('Valider')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('say_cancel')
                    .setLabel('Annuler')
                    .setStyle(ButtonStyle.Danger)
            );

            await interaction.editReply({
                embeds: [embed],
                components: [row]
            });
            return;
        }

        let webhook;
        try {
            // Créer un webhook temporaire
            webhook = await channel.createWebhook({
                name: displayName,
                avatar: avatarURL
            });

            // Envoyer le message via le webhook
            await webhook.send({
                content: message,
                username: displayName,
                avatarURL: avatarURL
            });

            await interaction.editReply({
                content: `Message envoyé en tant que ${displayName}.`
            });
        } catch (error) {
            if (webhook) {
                try { await webhook.delete(); } catch (e) {}
            }
            await interaction.editReply({
                content: `Erreur lors de l'envoi du message. Vérifie que l'URL de l'avatar est valide et accessible.`
            });
        } finally {
            if (webhook) {
                try { await webhook.delete(); } catch (e) {}
            }
        }
    },
};
