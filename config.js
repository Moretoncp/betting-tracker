/* =======================================================================
   SITE CONFIG — payment handles & Discord invite
   ======================================================================= */
const CONFIG = {
  discordInvite: "https://discord.gg/yXqYFmD9Hj",
 whopLink: "",  // Whop VIP checkout link
};

/* =======================================================================
   BET DATA
   result: "win" | "loss" | "push" | "pending"
   odds: American (e.g. -110, +150). stake in dollars.
   ======================================================================= */
const BETS = [
  { date: "2026-07-28", sport: "MLB", pick: "Detroit Tigers ML", type: "Moneyline", odds: -149, stake: 500, result: "pending", book: "" },
  { date: "2026-07-28", sport: "MLB", pick: "Phillies/Marlins o7.5", type: "Total", odds: -134, stake: 500, result: "pending", book: "" },
  { date: "2026-07-28", sport: "MLB", pick: "Padres ML vs Rockies", type: "Moneyline", odds: -223, stake: 500, result: "pending", book: "" },
  { date: "2026-07-28", sport: "MLB", pick: "Padres/Rockies o7.5", type: "Total", odds: -143, stake: 500, result: "pending", book: "" },
];
