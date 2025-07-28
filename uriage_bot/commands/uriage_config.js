// uriage_bot/commands/uriage_config.js

const {
    SlashCommandBuilder,
    ActionRowBuilder,
    RoleSelectMenuBuilder,
    PermissionFlagsBits,
    EmbedBuilder,
} = require('discord.js');
const { readJsonFromGCS, saveJsonToGCS } = require('../../uriage_bot/utils/gcs');

const SETTINGS_FILE_PATH = (guildId) => `data/${guildId}/${guildId}.json`;

// コマンド実行時の処理
async function execute(interaction) {
    // GCSからの読み込みに時間がかかる可能性があるため、先に応答を保留します
    await interaction.deferReply({ ephemeral: true });

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
}

// ロール選択メニューの操作を処理
async function handleRoleSelectMenu(interaction) {
    if (interaction.customId !== 'select_approval_roles') {
        return false;
    }

    await interaction.deferUpdate();

    const guildId = interaction.guildId;
    const selectedRoleIds = interaction.values;
    const settingsPath = SETTINGS_FILE_PATH(guildId);

    try {
        const currentSettings = await readJsonFromGCS(settingsPath) || {};
        const newSettings = {
            ...currentSettings,
            approvalRoleIds: selectedRoleIds,
        };

        await saveJsonToGCS(settingsPath, newSettings);

        const embed = new EmbedBuilder()
            .setTitle('✅ 設定完了')
            .setColor(0x57F287);

        if (selectedRoleIds.length > 0) {
            const roleMentions = selectedRoleIds.map(id => `<@&${id}>`).join(', ');
            embed.setDescription(`売上報告の承認ロールを以下に設定しました。\n${roleMentions}`);
        } else {
            embed.setDescription('売上報告の承認ロールをすべて解除しました。');
        }

        await interaction.editReply({ embeds: [embed], components: [] });

    } catch (error) {
        console.error('❌ 承認ロール設定の保存中にエラー:', error);
        await interaction.editReply({
            content: 'エラーが発生し、設定を保存できませんでした。',
            embeds: [],
            components: []
        });
    }

    return true;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('売上報告設定')
        .setDescription('売上報告を承認できるロールを設定します。')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    execute,
    handleRoleSelectMenu,
};
