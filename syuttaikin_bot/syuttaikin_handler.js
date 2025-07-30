const logger = require('@common/logger');

async function handleInteraction(interaction) {
    // 今後の実装のために、未実装であることをユーザーに伝える
    await interaction.reply({
        content: `機能「${interaction.component.label}」は現在開発中です。`,
        ephemeral: true,
    });
}

module.exports = {
    /**
     * syuttaikin_bot関連のコンポーネントインタラクションを処理します。
     * @param {import('discord.js').Interaction} interaction
     * @param {import('discord.js').Client} client
     * @returns {Promise<boolean>} - インタラクションを処理した場合はtrue、それ以外はfalse
     */
    async execute(interaction, client) {
        if (!interaction.isMessageComponent() && !interaction.isModalSubmit()) {
            return false;
        }

        const { customId } = interaction;

        // このハンドラが処理すべきcustomIdかを確認
        const targetCustomIds = [
            'config_cast_role_quest', 'config_cast_role_totsuna', 'config_cast_role_trojan',
            'config_add_arrival_time', 'config_add_departure_time',
            'config_delete_arrival_time', 'config_delete_departure_time',
            // 今後、出退勤ボタンのIDもここに追加
        ];

        if (targetCustomIds.includes(customId)) {
            await handleInteraction(interaction);
            return true;
        }

        // このハンドラでは処理されなかった
        return false;
    }
};