const { handleTimeModalSubmit } = require('./_handleTimeModalSubmit');

module.exports = {
    customId: 'modal_add_time_departure',
    async execute(interaction) {
        await handleTimeModalSubmit(interaction, 'departure');
    },
};