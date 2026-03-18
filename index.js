require('dotenv').config();
const { Telegraf } = require('telegraf');
const { JSONFileLowSync } = require('lowdb/node');
const cron = require('node-cron');

const BOT_TOKEN = process.env.BOT_TOKEN;
if (!BOT_TOKEN) {
  console.error('5879313391:AAE2pVb5IUS6I9UdkaVtwozTXxSUFse00eU');
  process.exit(1);
}

const bot = new Telegraf(5879313391:AAE2pVb5IUS6I9UdkaVtwozTXxSUFse00eU);
const db = new JSONFileLowSync('db.json');
db.data ||= { premiumUsers: {} };
db.write();

function isPremium(userId) {
  const user = db.data.premiumUsers[userId];
  return user && Date.now() < user.expires;
}

function addPremium(userId, period) {
  const days = { '1oy': 30, '3oy': 90, '6oy': 180 };
  const expires = Date.now() + (days[period] * 24 * 60 * 60 * 1000);
  db.data.premiumUsers[userId] = { period, expires };
  db.write();
}

// Har kun muddat tugaganlarni tozalash
cron.schedule('0 0 * * *', () => {
  const now = Date.now();
  for (let userId in db.data.premiumUsers) {
    if (now > db.data.premiumUsers[userId].expires) delete db.data.premiumUsers[userId];
  }
  db.write();
});

bot.start((ctx) => ctx.reply('🎧 VKMUSICXBOT PREMIUM MAX MUSIQA!\nMini App oching 👇'));

bot.on('message', async (ctx) => {
  if (!ctx.message.web_app_data) return;

  const data = JSON.parse(ctx.message.web_app_data.data);
  const userId = ctx.from.id;

  if (data.type === 'search') {
    const isPrem = isPremium(userId);
    const results = [
      { title: `${data.query} 🎵 8D`, url: 'http://example.com/audio1.mp3' },
      { title: `${data.query} 🔥 BassBoost`, url: 'http://example.com/audio2.mp3' },
      { title: `${data.query} ⭐ Premium Mix`, url: 'http://example.com/audio3.mp3' }
    ];

    if (!isPrem) {
      results.length = 1;
      ctx.reply('🆓 Free: 1 ta audio. Premium oling! 👑');
    } else {
      ctx.reply('👑 Premium: Cheksiz MAX MUSIQA!');
    }
    
    ctx.replyWithAudio({ url: results[0].url, title: results[0].title });
    return;
  }

  if (data.type === 'premium') {
    const prices = {
      '1oy': [{ label: '1 Oy Premium', amount: 100 }],
      '3oy': [{ label: '3 Oy Premium', amount: 250 }],
      '6oy': [{ label: '6 Oy Premium', amount: 350 }]
    };

    await ctx.replyWithInvoice(
      `VKMUSICX ${data.period.toUpperCase()}`,
      '✅ Cheksiz musiqa\n✅ Reklamasiz\n✅ Yuqori bitrat',
      data.period,
      'XTR',
      prices[data.period]
    );
  }
});

bot.on('pre_checkout_query', (ctx) => ctx.answerPreCheckoutQuery(true));
bot.on('successful_payment', async (ctx) => {
  const payload = ctx.message.successful_payment.invoice_payload;
  const userId = ctx.from.id;
  addPremium(userId, payload);
  const expires = new Date(db.data.premiumUsers[userId].expires).toLocaleDateString('uz-UZ');
  ctx.reply(`✅ Premium ${payload.toUpperCase()} sotib olindi!\nMuddat: ${expires} ✅`);
});

bot.command('status', (ctx) => {
  const userId = ctx.from.id;
  if (isPremium(userId)) {
    ctx.reply(`✅ Premium faol!`);
  } else {
    ctx.reply('❌ Free. Premium oling!');
  }
});

bot.launch();
console.log('✅ Bot ishga tushdi!');
