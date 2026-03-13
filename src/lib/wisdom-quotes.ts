/**
 * Curated wisdom from legendary investors and thinkers.
 * Shown during the pause breathing step to anchor composure.
 */
export interface WisdomQuote {
  text: string;
  author: string;
}

const QUOTES: WisdomQuote[] = [
  // Warren Buffett
  { text: "Be fearful when others are greedy, and greedy when others are fearful.", author: "Warren Buffett" },
  { text: "The stock market is a device for transferring money from the impatient to the patient.", author: "Warren Buffett" },
  { text: "Our favorite holding period is forever.", author: "Warren Buffett" },
  { text: "You don't need to be a genius to invest well. You need temperament.", author: "Warren Buffett" },

  // Charlie Munger
  { text: "The big money is not in the buying and the selling, but in the waiting.", author: "Charlie Munger" },
  { text: "The first rule of compounding: never interrupt it unnecessarily.", author: "Charlie Munger" },
  { text: "Knowing what you don't know is more useful than being brilliant.", author: "Charlie Munger" },

  // Michael Saylor
  { text: "Bitcoin is a swarm of cyber hornets serving the goddess of wisdom, feeding on the fire of truth.", author: "Michael Saylor" },
  { text: "Volatility is the price of admission for superior returns.", author: "Michael Saylor" },
  { text: "If you understand it, you have conviction. If you have conviction, you have patience.", author: "Michael Saylor" },

  // Nassim Nicholas Taleb
  { text: "The inability to predict outliers implies the inability to predict the course of history.", author: "Nassim Taleb" },
  { text: "Wind extinguishes a candle and energizes fire. You want to be the fire and wish for the wind.", author: "Nassim Taleb" },
  { text: "Difficulty is what wakes up the genius.", author: "Nassim Taleb" },

  // Benjamin Graham
  { text: "The investor's chief problem — and even his worst enemy — is likely to be himself.", author: "Benjamin Graham" },
  { text: "In the short run, the market is a voting machine. In the long run, it is a weighing machine.", author: "Benjamin Graham" },
  { text: "Have the courage of your knowledge and experience.", author: "Benjamin Graham" },

  // Howard Marks
  { text: "The biggest investing errors come not from factors that are informational or analytical, but from those that are psychological.", author: "Howard Marks" },
  { text: "To buy when others are despondently selling and to sell when others are euphorically buying takes the greatest courage.", author: "Howard Marks" },

  // Peter Lynch
  { text: "The real key to making money in stocks is not to get scared out of them.", author: "Peter Lynch" },
  { text: "Far more money has been lost by investors trying to anticipate corrections than in the corrections themselves.", author: "Peter Lynch" },

  // Stoic wisdom
  { text: "You have power over your mind — not outside events. Realize this, and you will find strength.", author: "Marcus Aurelius" },
  { text: "It is not what happens to you, but how you react to it that matters.", author: "Epictetus" },
  { text: "No man is free who is not master of himself.", author: "Epictetus" },
  { text: "The happiness of your life depends upon the quality of your thoughts.", author: "Marcus Aurelius" },

  // Satoshi / Bitcoin ethos
  { text: "If you don't believe me or don't get it, I don't have time to try to convince you, sorry.", author: "Satoshi Nakamoto" },
  { text: "The Times 03/Jan/2009 Chancellor on brink of second bailout for banks.", author: "Satoshi Nakamoto" },
];

/**
 * Returns a deterministic-ish quote for the current session.
 * Uses the current day + hour so you get a fresh one each session
 * but the same one if you re-enter within the hour.
 */
export function getSessionQuote(): WisdomQuote {
  const now = new Date();
  const seed = now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate() + now.getHours();
  return QUOTES[seed % QUOTES.length];
}
