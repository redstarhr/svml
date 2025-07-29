// uriage_bot/commands/uriage_config.js

const {
    SlashCommandBuilder,
    ActionRowBuilder,
    RoleSelectMenuBuilder,
    PermissionFlagsBits,
    EmbedBuilder,
} = require('discord.js');
const { readJsonFromGCS } = require('../../common/gcs/gcsUtils');
const logger = require('@common/logger');

const SETTINGS_FILE_PATH = (guildId) => `data/${guildId}/uriage/config.json`;

// コマンド実行時の処理
async function execute(interaction) {
    // GCSからの読み込みに時間がかかる可能性があるため、先に応答を保留します
    await interaction.deferReply({ ephemeral: true });

    try {
        const guildId = interaction.guildId;
        const settingsPath = SETTINGS_FILE_PATH(guildId);
        const currentSettings = await readJsonFromGCS(settingsPath) || {};
        const currentRoleIds = currentSettings.approvalRoleIds || [];

        const embed = new EmbedBuilder()
            .setTitle('⚙️ 売上報告 承認ロール設定')
            .setDescription('売上報告を承認できるロールを選択してください。\n複数選択が可能です。')
            .setColor(0x5865F2);

        if (currentRoleIds.length > 0) {
            const roleMentions = currentRoleIds.map(id => `<@&${id}>`).join(', ');
            embed.addFields({ name: '現在設定中のロール', value: roleMentions });
        } else {
            embed.addFields({ name: '現在設定中のロール', value: '未設定' });
        }

        const selectMenu = new RoleSelectMenuBuilder()
            .setCustomId('select_approval_roles')
            .setPlaceholder('承認ロールを選択...')
            .setMinValues(0) // 0個選択（全解除）を許可
            .setMaxValues(10); // 最大10個まで選択可能

        // 現在の設定をデフォルト値としてセット
        if (currentRoleIds.length > 0) {
            selectMenu.setDefaultRoles(currentRoleIds);
        }

        const row = new ActionRowBuilder().addComponents(selectMenu);

        await interaction.editReply({
            embeds: [embed],
            components: [row],
        });
    } catch (error) {
        logger.error('承認ロール設定の表示中にエラーが発生しました。', { guildId: interaction.guildId, error });
        await interaction.editReply({
            content: '設定の読み込み中にエラーが発生しました。しばらくしてからもう一度お試しください。',
            embeds: [], components: []
        });
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('売上報告設定')
        .setDescription('売上報告を承認できるロールを設定します。')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    execute,
};
