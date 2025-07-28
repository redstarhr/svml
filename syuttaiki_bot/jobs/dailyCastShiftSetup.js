const { Client, GatewayIntentBits } = require('discord.js');
const castStateManager = require('../utils/castShift/castStateManager');
const { createOrUpdateCastShiftEmbed } = require('../utils/castShift/castPanelManager');

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

async function dailySetup() {
  const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });

  client.once('ready', async () => {
    try {
      // 対象ギルドID・チャンネルIDは設定ファイルや環境変数等で管理想定
      const guildId = '対象ギルドID';
      const channelId = '対象チャンネルID';

      const guild = await client.guilds.fetch(guildId);
      const channel = await guild.channels.fetch(channelId);

      const today = new Date().toISOString().split('T')[0];
      const state = await castStateManager.loadOrInitState(guildId, today, channelId);

      await createOrUpdateCastShiftEmbed({ guildId, date: today, state, channel });

      // CSV保存はここに別途処理を実装
      await saveCsvData(guildId, today, state);

      console.log(`[dailySetup] キャスト出退勤パネル設置完了: ${today}`);
    } catch (err) {
      console.error('dailySetup error:', err);
    } finally {
      client.destroy();
    }
  });

  await client.login(DISCORD_BOT_TOKEN);
}

async function saveCsvData(guildId, date, state) {
  const { Storage } = require('@google-cloud/storage');
  const storage = new Storage();
  const bucketName = 'data-svml';

  const csvLines = ['時間,ユーザーID,退勤時間'];
  for (const time of Object.keys(state.shifts)) {
    const users = state.shifts[time];
    for (const userId of users) {
      const leaveTime = state.leaves?.[userId] || '';
      csvLines.push(`${time},${userId},${leaveTime}`);
    }
  }
  const csvContent = csvLines.join('\n');

  const filePath = `cast_shift/${guildId}/${date}_出退勤.csv`;

  await storage.bucket(bucketName).file(filePath).save(csvContent, {
    contentType: 'text/csv',
  });

  console.log(`[saveCsvData] CSV保存完了: gs://${bucketName}/${filePath}`);
}

module.exports = dailySetup;
