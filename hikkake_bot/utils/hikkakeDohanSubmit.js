// hikkake_bot/utils/hikkakeDohanSubmit.js
const { readState, writeState } = require('./hikkakeStateManager');
const { updateAllHikkakePanels } = require('./hikkakePanelManager');
const { logToThread } = require('./threadLogger');

module.exports = {
  customId: /^hikkake_douhan_submit_(quest|tosu|horse)_(\d+)_(\d+)_(\d+)/,
  async handle(interaction) {
    await interaction.deferReply({ flags: 64 }); // Ephemeral

    const match = interaction.customId.match(this.customId);
    const [, type, castUserId, guestCountStr, durationStr] = match;
    const guestCount = parseInt(guestCountStr, 10);
    const duration = parseInt(durationStr, 10);
    const arrivalTime = interaction.fields.getTextInputValue('arrival_time');

    const guildId = interaction.guildId;
    const state = await readState(guildId);

    // In this new flow, we assume 1 cast member is consumed.
    // You might want to adjust this if a "dohan" can involve more staff.
    const castPura = 1; // Assuming the selected cast is 'pura'
    const castKama = 0;

    // Check for available staff
    const allocatedPura = state.orders[type]
      .filter(order => order.type === 'order' || order.type === 'douhan' || order.type === 'casual_arrival')
      .reduce((sum, order) => sum + (order.castPura || 0), 0);
    const availablePura = (state.staff[type].pura || 0) - allocatedPura;

    if (castPura > availablePura) {
      return interaction.editReply({
        content: `❌ スタッフが不足しています。\n現在利用可能 - プラ: ${availablePura}人`,
      });
    }

    const newLog = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      type: 'douhan',
      people: guestCount, // 'people' now refers to guest count
      bottles: 0,
      castPura,
      castKama,
      douhanData: {
        castUserId,
        duration,
        arrivalTime,
      },
      timestamp: new Date().toISOString(),
      user: {
        id: interaction.user.id,
        username: interaction.user.username,
      },
      logUrl: null,
    };

    try {
      const logMessage = await logToThread(guildId, interaction.client, {
        user: interaction.user,
        logType: '同伴',
        details: { type, ...newLog },
        channelName: interaction.channel.name,
      });
      if (logMessage) {
        newLog.logUrl = logMessage.url;
      }
    } catch (e) {
      console.warn('[hikkakeDohanSubmit] ログ出力失敗', e);
    }

    state.orders[type].push(newLog);
    await writeState(guildId, state);
    await updateAllHikkakePanels(interaction.client, guildId, state);

    await interaction.editReply({ content: '✅ 同伴情報を記録しました。' });
  },
};