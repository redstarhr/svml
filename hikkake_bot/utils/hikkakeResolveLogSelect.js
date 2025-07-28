// hikkake_bot/utils/hikkakeResolveLogSelect.js
const { readState, writeState } = require('./hikkakeStateManager');
const { updateAllHikkakePanels } = require('./hikkakePanelManager');
const { logToThread } = require('./threadLogger');

module.exports = {
  customId: /^hikkake_resolve_log_(confirm|fail)_(quest|tosu|horse)/,
  async handle(interaction) {
    await interaction.deferUpdate();

    const match = interaction.customId.match(this.customId);
    const [, action, type] = match; // action is 'confirm' or 'fail'
    const logIdToResolve = interaction.values[0];

    const guildId = interaction.guildId;
    const state = await readState(guildId);

    const logToUpdate = state.orders[type].find(log => log.id === logIdToResolve);

    if (!logToUpdate) {
      await interaction.editReply({
        content: '❌ エラー: 対象のログが見つかりませんでした。既に取り消されている可能性があります。',
        components: [],
      });
      return;
    }

    // Mark the log with a status and a leave timestamp to trigger cleanup
    logToUpdate.status = action === 'confirm' ? 'confirmed' : 'failed';
    logToUpdate.leaveTimestamp = new Date().toISOString();

    await writeState(guildId, state);
    await updateAllHikkakePanels(interaction.client, guildId, state);

    const logType = action === 'confirm' ? 'ひっかけ確定' : 'ひっかけ失敗';
    try {
      await logToThread(guildId, interaction.client, {
        user: interaction.user,
        logType: logType,
        details: { type, resolvedLog: logToUpdate },
        channelName: interaction.channel.name,
      });
    } catch (e) {
      console.warn('[hikkakeResolveLogSelect] ログ出力失敗', e);
    }

    const replyMessage = action === 'confirm'
      ? '✅ 選択された「ひっかけ予定」を **確定** しました。'
      : '✅ 選択された「ひっかけ予定」を **失敗** として記録しました。';

    await interaction.editReply({
      content: `${replyMessage} 10分後に自動で削除されます。`,
      components: [],
    });
  },
};