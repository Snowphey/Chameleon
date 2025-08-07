const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const identityManager = require('../../utils/identityManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('saycharacter')
        .setDescription('Envoyer un message en utilisant une identité enregistrée.')
        .addStringOption(option =>
            option.setName('character')
                .setDescription('Le nom de l\'identité à utiliser')
                .setRequired(true)
                .setAutocomplete(true))
        .addStringOption(option =>
            option.setName('message')
                .setDescription('Le message à envoyer')
                .setRequired(true))
        .addBooleanOption(option =>
            option.setName('preview')
                .setDescription('Prévisualiser le message avant envoi')),
    async autocomplete(interaction) {
        const focusedValue = interaction.options.getFocused();
        const userId = interaction.user.id;

        try {
            const identityNames = await identityManager.getAllIdentityNames(userId);
            const filtered = identityNames.filter(name => 
                name.toLowerCase().includes(focusedValue.toLowerCase())
            ).slice(0, 25); // Discord limite à 25 suggestions

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
        let message = interaction.options.getString('message');
        const channel = interaction.channel;
        const preview = interaction.options.getBoolean('preview');

        // Remplacer les séquences '\n' par des vrais retours à la ligne
        message = message.replace(/\\n/g, '\n');

        try {
            // Récupérer l'identité depuis la base de données
            const identity = await identityManager.getIdentity(characterName);
            
            if (!identity) {
                await interaction.reply({
                    content: `❌ Aucune identité trouvée avec le nom "${characterName}". Utilisez \`/saveidentity\` pour en créer une.`,
                    flags: MessageFlags.Ephemeral
                });
                return;
            }

            // Vérifier que l'avatar de l'identité est toujours valide
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });
            
            const isValidImage = await identityManager.validateAvatarUrl(identity.avatar_url);
            if (!isValidImage) {
                await interaction.editReply({
                    content: `❌ L'avatar de l'identité "${characterName}" n'est plus accessible. Veuillez la recréer avec \`/saveidentity\`.`
                });
                return;
            }

            
            if (preview) {
                const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
                const embed = new EmbedBuilder()
                    .setAuthor({ name: identity.name, iconURL: identity.avatar_url })
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
                    name: identity.name,
                    avatar: identity.avatar_url
                });

                // Envoyer le message via le webhook
                await webhook.send({
                    content: message,
                    username: identity.name,
                    avatarURL: identity.avatar_url
                });

                await interaction.editReply({
                    content: `Message envoyé en tant que ${identity.name}.`
                });
            } catch (error) {
                console.error('Erreur lors de l\'envoi du message:', error);
                if (webhook) {
                    try { await webhook.delete(); } catch (e) {}
                }
                await interaction.editReply({
                    content: `❌ Erreur lors de l'envoi du message. L'avatar de cette identité n'est peut-être plus accessible.`
                });
            } finally {
                if (webhook) {
                    try { await webhook.delete(); } catch (e) {}
                }
            }
        } catch (error) {
            console.error('Erreur lors de la récupération de l\'identité:', error);
            await interaction.editReply({
                content: `❌ Erreur lors de la récupération de l'identité.`
            });
        }
    },
};
