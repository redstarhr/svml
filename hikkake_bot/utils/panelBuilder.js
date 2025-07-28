// utils/panelBuilder.js

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { DateTime } = require('luxon');

/**
 * Builds one of the two panel embeds.
 * @param {'status' | 'orders'} panelType - The type of panel to build.
 * @param {'quest' | 'tosu' | 'horse'} hikkakeType - The category.
 * @param {object} state - The current state object.
 * @returns {EmbedBuilder}
 */
function buildPanelEmbed(panelType, hikkakeType, state, guildId) {

  if (panelType === 'status') {
    let orderedTypes;

    // パネルのプライマリカテゴリに基づいて表示順を設定
    switch (hikkakeType) {
      case 'quest':
        orderedTypes = ['quest', 'tosu', 'horse'];
        break;
      case 'tosu':
        orderedTypes = ['tosu', 'quest', 'horse'];
        break;
      case 'horse':
        orderedTypes = ['horse', 'tosu', 'quest'];
        break;
      default:
        orderedTypes = ['quest', 'tosu', 'horse'];
        break;
    }

    const linkTextMap = {
      quest: '【📜｜クエスト依頼】へ',
      tosu: '【🔭｜凸スナ】へ',
      horse: '【🐴｜トロイの木馬-旧店況】へ',
    };

    const descriptionLines = orderedTypes.map(type => {
      const staff = state.staff?.[type] || { pura: 0, kama: 0 };
      const orders = state.orders?.[type] || [];
      const allocatedPura = orders
        .filter(order => !order.leaveTimestamp && (order.type === 'order' || order.type === 'douhan' || order.type === 'casual_arrival'))
        .reduce((sum, order) => sum + (order.castPura || 0), 0);
      const allocatedKama = orders
        .filter(order => !order.leaveTimestamp && (order.type === 'order' || order.type === 'douhan' || order.type === 'casual_arrival'))
        .reduce((sum, order) => sum + (order.castKama || 0), 0);
      const availablePura = (staff.pura || 0) - allocatedPura;
      const availableKama = (staff.kama || 0) - allocatedKama;

      const panelInfo = state.panelMessages?.[type];
      // 各カテゴリの「受注一覧」パネルへのメッセージリンクを生成
      const messageLink = panelInfo && panelInfo.channelId && panelInfo.ordersMessageId && guildId
        ? `https://discord.com/channels/${guildId}/${panelInfo.channelId}/${panelInfo.ordersMessageId}`
        : '#'; // リンクが作れない場合のフォールバック

      const linkText = `[${linkTextMap[type]}](${messageLink})`;
      return `${linkText}\nプラ: ${availablePura}人\nカマ: ${availableKama}人}`;
    });

    return new EmbedBuilder()
      .setTitle('■ 店内状況')
      .setDescription(descriptionLines.join('\n\n'))
      .setColor(0x0099ff)
      .setTimestamp();
  }

  if (panelType === 'orders') {
    const orders = state.orders?.[hikkakeType] || [];
    const embed = new EmbedBuilder()
      .setTitle(`■ ひっかけ一覧 (${hikkakeType.toUpperCase()})`)
      .setColor(0x00cc99)
      .setTimestamp();

    if (orders.length === 0) {
      embed.setDescription('現在、受注はありません。');
    } else {
      const description = orders.map(order => {
        const typeLabelMap = {
          order: order.status === 'failed' ? 'ひっかけ失敗' : (order.status === 'confirmed' ? 'ひっかけ確定' : 'ひっかけ予定'),
          douhan: '同伴',
          casual_leave: '退店',
          casual_arrival: 'ふらっと来た',
        };
        const typeLabel = typeLabelMap[order.type] || 'ログ';

        const castPura = order.castPura || 0;
        const castKama = order.castKama || 0;
        const totalCast = castPura + castKama;
        const timestamp = DateTime.fromISO(order.timestamp).setZone('Asia/Tokyo').toFormat('HH:mm');
        const userMention = order.user?.id ? `<@${order.user.id}>` : '不明';

        let parts;
        if (order.type === 'casual_arrival') {
          parts = [`【${typeLabel}】キャスト： プラ-${castPura}人 / カマ-${castKama}人`];
        } else {
          if (order.type === 'douhan' && order.douhanData) {
            const { castUserId, duration, arrivalTime } = order.douhanData;
            const durationHours = Math.floor(duration / 60);
            const durationMins = duration % 60;
            let durationLabel = '';
            if (durationHours > 0) durationLabel += `${durationHours}時間`;
            if (durationMins > 0) durationLabel += `${durationMins}分`;
            parts = [`🍣【${typeLabel}】同伴キャスト: <@${castUserId}>`, `客数: ${order.people}人`, `同伴時間: ${durationLabel}`, `来店予定時間: ${arrivalTime}`];
          } else if (order.type === 'order') {
            if (order.status === 'confirmed') {
              parts = ['🐟 【ひっかけ確定】'];
            } else if (order.status === 'pending') {
              parts = [
                `🎣【${typeLabel}】`,
                `客数: ${order.people}人`,
                `本数: ${order.bottles}本`,
                `キャスト:プラ ${castPura}人　カマ ${castKama}人`
              ];
            } else { // failed
              const resolvedTime = DateTime.fromISO(order.leaveTimestamp).setZone('Asia/Tokyo').toFormat('HH:mm');
              parts = [`【${typeLabel}】確定時間：${resolvedTime}`, `キャスト: -${totalCast}人`, `ひっかけ人数: ${order.people}人`, `本数: ${order.bottles}本`];
            }
          } else {
            // 不明なログタイプやデータが壊れている場合のフォールバック表示
            parts = [`【${typeLabel}】ログID: ${order.id}`];
          }
        }
        let meta;
        if (order.type === 'douhan') {
          meta = `入力時間：${timestamp} ${userMention}`;
        } else if (order.type === 'order' && order.status === 'confirmed') {
          // 確定ログはシンプルにメンションのみ
          meta = userMention;
        } else {
          // それ以外のログ（ひっかけ予定、失敗など）もメンションを表示
          meta = userMention;
        }

        return `${parts.join('　')}　　${meta}`;
      }).join('\n');
      embed.setDescription(description);
    }
    return embed;
  }

  // Fallback for unknown type
  return new EmbedBuilder().setTitle('エラー').setDescription('不明なパネルタイプです。');
}

function buildPanelButtons(type) {
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`hikkake_${type}_plakama`)
      .setLabel('スタッフ数入力(プラカマ)')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`hikkake_${type}_order`)
      .setLabel('ひっかけ予定')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`hikkake_${type}_arrival`)
      .setLabel('ふらっと来た')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`hikkake_${type}_douhan`)
      .setLabel('同伴')
      .setStyle(ButtonStyle.Primary)
  );
  return [row];
}

function buildOrdersPanelButtons(type) {
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`hikkake_${type}_confirm`).setLabel('ひっかけ確定').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId(`hikkake_${type}_fail`).setLabel('ひっかけ失敗').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(`hikkake_${type}_leave`).setLabel('退店').setStyle(ButtonStyle.Danger)
  );
  return [row];
}

module.exports = {
  buildPanelEmbed,
  buildPanelButtons,
  buildOrdersPanelButtons,
};
