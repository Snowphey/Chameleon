
const { SlashCommandBuilder, MessageFlags } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('say')
        .setDescription('Impersonate un membre pour envoyer un message.')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('Le membre à impersonate')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('message')
                .setDescription('Le message à envoyer')
                .setRequired(true))
        .addAttachmentOption(option =>
            option.setName('upload')
                .setDescription("Image à uploader et joindre au message")
                .setRequired(false))
        .addBooleanOption(option =>
            option.setName('preview')
                .setDescription('Prévisualiser le message avant envoi')
                .setRequired(false)),
    async execute(interaction) {
        const { blacklist } = require('../../config.json');
        if (blacklist && blacklist.includes(interaction.user.id)) {
            await interaction.reply({
                content: `⛔ Vous êtes exclu de l'utilisation de cette commande.`,
                flags: MessageFlags.Ephemeral
            });
            return;
        }

        const user = interaction.options.getUser('user');
        let message = interaction.options.getString('message');
        const channel = interaction.channel;
        const preview = interaction.options.getBoolean('preview');
        const upload = interaction.options.getAttachment('upload');

        // Remplacer les séquences '\n' par des vrais retours à la ligne
        message = message.replace(/\\n/g, '\n');

        // Récupérer le membre du serveur pour avoir le pseudo et la couleur
        const member = await interaction.guild.members.fetch(user.id);
        const displayName = member.displayName;
        // Chercher la couleur du rôle le plus haut (hors @everyone)
        const roleColor = member.roles.highest.color || null;

        if (preview) {
            // Afficher un embed de prévisualisation avec boutons
            const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
            const embed = new EmbedBuilder()
                .setAuthor({ name: displayName, iconURL: user.displayAvatarURL({ dynamic: true }) })
                .setDescription(message)
                .setColor(roleColor || 0x2F3136);
                if (upload) {
                    embed.setImage(upload.url);
                }

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

            await interaction.reply({
                embeds: [embed],
                components: [row],
                flags: MessageFlags.Ephemeral
            });
        } else {
            // Créer un webhook temporaire
            const webhook = await channel.createWebhook({
                name: displayName,
                avatar: user.displayAvatarURL({ dynamic: true })
            });

            // Préparer les options du webhook (toujours texte simple)
            let options = {
                content: message,
                username: displayName,
                avatarURL: user.displayAvatarURL({ dynamic: true })
            };
            if (upload) {
                options.files = [upload.url];
            }

            // Envoyer le message via le webhook
            await webhook.send(options);

            // Supprimer le webhook après envoi
            await webhook.delete();

            await interaction.reply({ 
                content: `Message envoyé en tant que ${displayName}.`, 
                flags: MessageFlags.Ephemeral
            });
        }
    },
};
