// hikkake_bot/utils/hikkake_button_handler.js
const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, StringSelectMenuOptionBuilder, UserSelectMenuBuilder } = require('discord.js');
const { createSelectMenuRow, createNumericOptions } = require('./discordUtils');
const { readState } = require('./hikkakeStateManager');
const { DateTime } = require('luxon');
const { logToThread } = require('./threadLogger');

module.exports = {
  /**
   * @param {import('discord.js').ButtonInteraction} interaction
   */
  async execute(interaction) {
    if (!interaction.isButton()) return false;

    // --- Reaction settings button handler ---
    const reactionMatch = interaction.customId.match(/^set_react_(quest|tosu|horse)_(num|count)$/);
    if (reactionMatch) {
      const [, type, key] = reactionMatch;
      const keyLabel = key === 'num' ? '人数' : '本数';
      const keyPlaceholder = key === 'num' ? '例: 1人' : '例: 3本';

      const modal = new ModalBuilder()
        .setCustomId(`hikkake_reaction_submit_${type}_${key}`)
        .setTitle(`【${type.toUpperCase()}】${keyLabel}別 反応文設定`);

      const targetInput = new TextInputBuilder()
        .setCustomId('target_value')
        .setLabel(`対象の${keyLabel}を入力`)
        .setStyle(TextInputStyle.Short)
        .setPlaceholder(keyPlaceholder)
        .setRequired(true);

      const reactionsInput = new TextInputBuilder()
        .setCustomId('reaction_messages')
        .setLabel('追加する反応文（改行で複数登録）')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('例: すごい！\nやるじゃん！')
        .setRequired(true);

      modal.addComponents(new ActionRowBuilder().addComponents(targetInput), new ActionRowBuilder().addComponents(reactionsInput));
      await interaction.showModal(modal);
      return true;
    }
    // --- End of reaction settings handler ---

    const match = interaction.customId.match(/^hikkake_(quest|tosu|horse)_(plakama|order|leave|arrival|douhan|confirm|fail)$/);
    if (!match) return false;

    const [, type, action] = match;

    try {
      let row, content;

      // すべてのアクションは「プラ」の人数選択から開始
      if (action === 'plakama') {
        content = `【${type.toUpperCase()}】プラカマ設定: まずプラの人数を選択してください。`;
        row = createSelectMenuRow(`hikkake_plakama_step1_${type}`, 'プラの人数を選択 (1-25)', createNumericOptions(25, '人'));
      } else if (action === 'order') {
        content = `【${type.toUpperCase()}】ひっかけ予定: まずお客様の人数を選択してください。`;
        row = createSelectMenuRow(`hikkake_order_step1_guest_${type}`, '客数を選択 (0-24)', createNumericOptions(25, '人', 0));
      } else if (action === 'leave') {
        const state = await readState(interaction.guildId);
        const activeLogs = state.orders[type].filter( // 退店は「同伴」と「ふらっと来た」のみが対象
          log => !log.leaveTimestamp && (log.type === 'casual_arrival' || log.type === 'douhan')
        );

        if (activeLogs.length === 0) {
          await interaction.reply({
            content: '退店または完了させられるログがありません。',
            flags: 64, // Ephemeral
          });
          return true;
        }

        const options = activeLogs.slice(0, 25).map(log => {
          const timestamp = DateTime.fromISO(log.timestamp).setZone('Asia/Tokyo').toFormat('HH:mm');
          let label;
          if (log.type === 'order') {
            label = `[ひっかけ] ${timestamp} ${log.user.username} (${log.people}人/${log.bottles}本)`;
          } else if (log.type === 'douhan') {
            label = `[同伴] ${timestamp} ${log.user.username} (${log.people}人)`;
          } else { // casual_arrival
            label = `[到着] ${timestamp} ${log.user.username} (${log.people}人)`;
          }
          return new StringSelectMenuOptionBuilder()
            .setLabel(label.substring(0, 100))
            .setValue(log.id);
        });

        content = '退店または完了させるログを選択してください。';
        row = createSelectMenuRow(`hikkake_retire_log_${type}`, 'ログを選択...', options);
      } else if (action === 'arrival') {
        content = `【${type.toUpperCase()}】ふらっと来た: 担当したプラの人数を選択してください。`;
        row = createSelectMenuRow(`hikkake_arrival_step1_${type}`, '追加プラの人数を選択 (0-24)', createNumericOptions(25, '人', 0));
      } else if (action === 'douhan') {
        content = `【${type.toUpperCase()}】同伴: 同伴するキャストを選択してください。`;
        const userSelectMenu = new UserSelectMenuBuilder()
          .setCustomId(`hikkake_douhan_step1_user_${type}`)
          .setPlaceholder('キャストを選択...');
        row = new ActionRowBuilder().addComponents(userSelectMenu);
      } else if (action === 'confirm' || action === 'fail') {
        const state = await readState(interaction.guildId);
        const hikkakeLogs = state.orders[type].filter(
          log => log.type === 'order' && !log.leaveTimestamp
        );

        if (hikkakeLogs.length === 0) {
          await interaction.reply({
            content: '対象となる「ひっかけ予定」のログがありません。',
            flags: 64, // Ephemeral
          });
          return true;
        }

        const options = hikkakeLogs.slice(0, 25).map(log => {
          const timestamp = DateTime.fromISO(log.timestamp).setZone('Asia/Tokyo').toFormat('HH:mm');
          const label = `[ひっかけ] ${timestamp} ${log.user.username} (${log.people}人/${log.bottles}本)`;
          return new StringSelectMenuOptionBuilder()
            .setLabel(label.substring(0, 100))
            .setValue(log.id);
        });

        const actionLabel = action === 'confirm' ? '確定' : '失敗';
        content = `【${actionLabel}】させる「ひっかけ予定」のログを選択してください。`;
        row = createSelectMenuRow(`hikkake_resolve_log_${action}_${type}`, 'ログを選択...', options);

      } else if (action === 'confirm_old') { // Keeping the old disabled button logic just in case
          await interaction.reply({
              content: 'この機能は現在開発中です。',
              flags: 64, // Ephemeral
          });
          return true;
      }

      if (row && content) {
        await interaction.reply({
          content,
          components: [row],
          flags: 64, // 64 is MessageFlags.Ephemeral
        });
        return true;
      }

      return false;
    } catch (error) {
      console.error('[hikkake_button_handler] ボタン処理エラー:', error);
      if (!interaction.replied && !interaction.deferred) {
        try {
          await interaction.reply({ content: 'ボタン処理中にエラーが発生しました。', ephemeral: true });
        } catch (e) {
          console.error('[hikkake_button_handler] エラー返信失敗:', e);
        }
      }
      return true;
    } // This closing brace was missing
  },
};
