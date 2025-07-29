// uriage_bot/handlers/uriage_config_handler.js
const { readJsonFromGCS, saveJsonToGCS } = require('../../common/gcs/gcsUtils.js');

const SETTINGS_FILE_PATH = (guildId) => `uriage_bot/${guildId}/config.json`;

module.exports = {
    async execute(interaction) {
        if (!interaction.isRoleSelectMenu() || interaction.customId !== 'select_approval_roles') {
            return false;
        }

        await interaction.deferUpdate();
        const guildId = interaction.guildId;
        const selectedRoleIds = interaction.values;

        const settingsPath = SETTINGS_FILE_PATH(guildId);
        const config = await readJsonFromGCS(settingsPath) || {};
        config.approvalRoleIds = selectedRoleIds;

        await saveJsonToGCS(settingsPath, config);

        const roleMentions = selectedRoleIds.length > 0
            ? selectedRoleIds.map(id => `<@&${id}>`).join(', ')
            : '未設定';

        await interaction.editReply({
            content: `✅ 承認ロールを更新しました。\n**新しい設定:** ${roleMentions}`,
            components: [], // Remove the select menu
            embeds: [], // Remove the original embed
        });

        return true;
    }
};