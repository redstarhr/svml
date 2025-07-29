const { saveJsonToGCS, readJsonFromGCS } = require('../utils/gcs');

const path = `data-svml/${guildId}/level/config.json`;
await saveJsonToGCS(path, { stamps: [], ignoreRoles: [] });

const config = await readJsonFromGCS(path);
