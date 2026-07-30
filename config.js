/* =======================================================================
   SITE CONFIG — payment handles & Discord invite
   ======================================================================= */
const CONFIG = {
  discordInvite: "https://discord.gg/yXqYFmD9Hj",
  vipLink: "https://www.launchpass.com/chuck5674-betting-lounge/vip",  // LaunchPass VIP checkout link
};

/* =======================================================================
   BET DATA
   result: "win" | "loss" | "push" | "pending"
   odds: American (e.g. -110, +150). stake in dollars.
   ======================================================================= */
const BETS = [
  { date: "2026-07-28", sport: "MLB", pick: "Detroit Tigers ML", type: "Moneyline", odds: -149, stake: 500, result: "win", book: "" },
  { date: "2026-07-28", sport: "MLB", pick: "Phillies/Marlins o7.5", type: "Total", odds: -134, stake: 500, result: "loss", book: "" },
  { date: "2026-07-28", sport: "MLB", pick: "Padres ML vs Rockies", type: "Moneyline", odds: -223, stake: 500, result: "win", book: "" },
  { date: "2026-07-28", sport: "MLB", pick: "Padres/Rockies o7.5", type: "Total", odds: -143, stake: 500, result: "win", book: "" },
  { date: "2026-07-29", sport: "MLB", pick: "Blue Jays vs Nationals YRFI", type: "Prop", odds: -126, stake: 250, result: "loss", book: "" },
  { date: "2026-07-29", sport: "MLB", pick: "Chase DeLauter o1.5 Total Bases", type: "Prop", odds: 108, stake: 100, result: "loss", book: "" },
  { date: "2026-07-29", sport: "MLB", pick: "Kyle Manzardo o1.5 Total Bases", type: "Prop", odds: 144, stake: 100, result: "win", book: "" },
  { date: "2026-07-29", sport: "MLB", pick: "Pete Crow-Armstrong o1.5 Total Bases", type: "Prop", odds: 115, stake: 250, result: "win", book: "" },
  { date: "2026-07-29", sport: "MLB", pick: "Yordan Alvarez o1.5 Total Bases", type: "Prop", odds: -136, stake: 250, result: "loss", book: "" },
  { date: "2026-07-29", sport: "MLB", pick: "Wilson Contreras o1.5 Total Bases", type: "Prop", odds: 186, stake: 100, result: "push", book: "" },
  { date: "2026-07-29", sport: "MLB", pick: "Jordan Walker o1.5 Total Bases", type: "Prop", odds: 113, stake: 100, result: "loss", book: "" },
  { date: "2026-07-30", sport: "MLB", pick: "Rays ML vs Rangers", type: "Moneyline", odds: -155, stake: 500, result: "win", book: "" },
  { date: "2026-07-30", sport: "MLB", pick: "Red Sox ML", type: "Moneyline", odds: -191, stake: 500, result: "pending", book: "" },
];
