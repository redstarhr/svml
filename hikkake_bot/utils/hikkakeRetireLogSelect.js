// hikkake_bot/utils/hikkakeRetireLogSelect.js
const { readState, writeState } = require('./hikkakeStateManager');
const { updateAllHikkakePanels } = require('./hikkakePanelManager');
const { logToThread } = require('./threadLogger');

module.exports = {
  customId: /^hikkake_retire_log_(quest|tosu|horse)/,
  async handle(interaction) {
    await interaction.deferUpdate();

    const match = interaction.customId.match(this.customId);
    const type = match[1];
    const logIdToRetire = interaction.values[0];

    const guildId = interaction.guildId;
    const state = await readState(guildId);

    const logToUpdate = state.orders[type].find(log => log.id === logIdToRetire);

    if (!logToUpdate) {
      await interaction.editReply({
        content: '❌ エラー: 対象のログが見つかりませんでした。既に取り消されている可能性があります。',
        components: [],
      });
      return;
    }

    // ログを削除する代わりに、退店時刻を記録する
    logToUpdate.leaveTimestamp = new Date().toISOString();

    await writeState(guildId, state);
    await updateAllHikkakePanels(interaction.client, guildId, state);

    try {
      await logToThread(guildId, interaction.client, {
        user: interaction.user,
        logType: 'ログ退店',
        details: { type, retiredLog: logToUpdate },
        channelName: interaction.channel.name,
      });
    } catch (e) {
      console.warn('[hikkakeRetireLogSelect] ログ出力失敗', e);
    }

    await interaction.editReply({
      content: '✅ 選択されたログを退店済みにしました。10分後に自動で削除されます。',
      components: [],
    });
  },
};