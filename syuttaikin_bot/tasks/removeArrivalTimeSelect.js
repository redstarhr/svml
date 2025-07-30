const { handleRemoveTimeSelect } = require('../components/settings/_handleRemoveTimeSelect');

module.exports = {
    customId: 'setting_remove_arrival_time',
    async execute(interaction) {
        await handleRemoveTimeSelect(interaction, 'arrival');
    },
};