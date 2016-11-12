const bot = require('./bot.js');

// bot.query('rembrandt', (err, data) => {
//     console.log('%j', data);
// });
//
bot.paintingsByArtist('Q5598', (err, data) => {
    console.log('%j', data);
})