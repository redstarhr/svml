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

    // 「同伴」ではキャストが1人消費されると仮定し、プラ・カマのどちらか空いている方を割り当てる
    let castPura = 0;
    let castKama = 0;

    // Check for available staff
    const allocatedPura = state.orders[type]
      .filter(order => !order.leaveTimestamp && (order.type === 'order' || order.type === 'douhan' || order.type === 'casual_arrival'))
      .reduce((sum, order) => sum + (order.castPura || 0), 0);
    const allocatedKama = state.orders[type]
      .filter(order => !order.leaveTimestamp && (order.type === 'order' || order.type === 'douhan' || order.type === 'casual_arrival'))
      .reduce((sum, order) => sum + (order.castKama || 0), 0);

    const availablePura = (state.staff[type].pura || 0) - allocatedPura;
    const availableKama = (state.staff[type].kama || 0) - allocatedKama;

    if (availablePura >= 1) {
      castPura = 1;
    } else if (availableKama >= 1) {
      castKama = 1;
    } else {
      return interaction.editReply({
        content: `❌ 同伴に出せるスタッフがいません。\n現在利用可能 - プラ: ${availablePura}人, カマ: ${availableKama}人`,
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