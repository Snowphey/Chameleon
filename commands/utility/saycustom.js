const { SlashCommandBuilder, MessageFlags } = require('discord.js');

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

        const displayName = interaction.options.getString('displayname');
        const avatarURL = interaction.options.getString('avatarurl');
        let message = interaction.options.getString('message');
        const channel = interaction.channel;

        // Remplacer les séquences '\n' par des vrais retours à la ligne
        message = message.replace(/\\n/g, '\n');

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

            await interaction.reply({
                content: `Message envoyé en tant que ${displayName}.`,
                flags: MessageFlags.Ephemeral
            });
        } catch (error) {
            if (webhook) {
                try { await webhook.delete(); } catch (e) {}
            }
            await interaction.reply({
                content: `Erreur lors de l'envoi du message. Vérifie que l'URL de l'avatar est valide et accessible.`,
                flags: MessageFlags.Ephemeral
            });
        } finally {
            if (webhook) {
                try { await webhook.delete(); } catch (e) {}
            }
        }
    },
};
