const bot = require('./bot.js');

function handle(err, data) {
    if (err) {
        console.log(err);
    } else {
        console.log('%j', data);
    }
}

// bot.query('rembrandt', handle);
bot.paintingsByArtist('Q49987', handle);
// bot.searchPainters('doesbrug', handle);
// bot.painterByDate(6, 15, handle);
// bot.getMonuments(handle);