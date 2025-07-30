const { handleTimeModalSubmit } = require('./_handleTimeModalSubmit');

module.exports = {
    customId: 'modal_add_time_arrival',
    async execute(interaction) {
        await handleTimeModalSubmit(interaction, 'arrival');
    },
};