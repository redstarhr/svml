const { DateTime } = require('luxon');
const { downloadFile, uploadFile } = require('../utils/gcsHelper');
const { getConfig } = require('../utils/configManager');
const { updatePanel } = require('../utils/panelManager');

const CSV_HEADER = 'user_id,user_name,status,clock_in_type,clock_in_time,clock_out_time';

function getCsvPath(guildId) {
  const today = DateTime.now().setZone('Asia/Tokyo').toFormat('yyyy-MM-dd');
  // 仕様書に準拠したパス
  return `data-svml/${guildId}/キャスト出退勤/${today}_出退勤.csv`;
}

/**
 * Parses CSV content into an array of attendance records.
 * @param {string|null} csvContent
 * @returns {Array<object>}
 */
function parseCsv(csvContent) {
  if (!csvContent) return [];
  const lines = csvContent.trim().split('\n');
  if (lines.length <= 1) return []; // Header only or empty

  const header = lines[0].split(',');
  return lines.slice(1).map(line => {
    const values = line.split(',');
    const record = {};
    header.forEach((key, index) => {
      record[key.trim()] = values[index] ? values[index].trim() : '';
    });
    return record;
  });
}

/**
 * Converts an array of attendance records back to a CSV string.
 * @param {Array<object>} records
 * @returns {string}
 */
function toCsv(records) {
  if (records.length === 0) {
    return CSV_HEADER;
  }
  const header = CSV_HEADER.split(',');
  const headerString = header.join(',');
  const rows = records.map(record => header.map(key => record[key] || '').join(','));
  return [headerString, ...rows].join('\n');
}

/**
 * Generates a work map for the panel from attendance records.
 * @param {Array<object>} records
 * @returns {Map<string, {id: string, name: string}[]>}
 */
function createWorkMap(records) {
  const workMap = new Map();
  records.forEach(record => {
    const key = record.status === 'left' ? 'left' : record.clock_in_type;
    if (!workMap.has(key)) {
      workMap.set(key, []);
    }
    workMap.get(key).push({ id: record.user_id, name: record.user_name });
  });
  return workMap;
}

async function handleButton(interaction) {
  if (!interaction.customId.startsWith('syuttaikin_')) return false;

  await interaction.deferUpdate();

  const guildId = interaction.guild.id;
  const user = interaction.user;
  const csvPath = getCsvPath(guildId);

  const [action, clockInType] = interaction.customId.substring('syuttaikin_'.length).split('_');

  const csvContent = await downloadFile(csvPath);
  let records = parseCsv(csvContent);

  const now = DateTime.now().setZone('Asia/Tokyo');
  const nowISO = now.toISO();

  const userRecordIndex = records.findIndex(r => r.user_id === user.id && r.status === 'working');

  if (action === 'clock-in') {
    if (userRecordIndex !== -1) {
      // Already clocked in, update the type and time
      records[userRecordIndex].clock_in_type = clockInType;
      records[userRecordIndex].clock_in_time = nowISO;
    } else {
      // New clock-in
      records.push({
        user_id: user.id,
        user_name: user.username,
        status: 'working',
        clock_in_type: clockInType,
        clock_in_time: nowISO,
        clock_out_time: '',
      });
    }
  } else if (action === 'clock-out') {
    if (userRecordIndex !== -1) {
      records[userRecordIndex].status = 'left';
      records[userRecordIndex].clock_out_time = nowISO;
    } else {
      // Not clocked in, can't clock out
      await interaction.followUp({ content: '出勤記録がありません。先に出勤ボタンを押してください。', ephemeral: true });
      return true; // Handled
    }
  }

  const newCsvContent = toCsv(records);
  await uploadFile(csvPath, newCsvContent);

  // Update the panel
  const config = await getConfig(guildId);
  const workMap = createWorkMap(records);
  await updatePanel(interaction, config, workMap);

  return true;
}

module.exports = {
  async execute(interaction) {
    if (interaction.isButton()) {
      return await handleButton(interaction);
    }
    return false;
  },
};
