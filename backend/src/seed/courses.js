// Learn-to-Earn micro-courses. Each is ~60 seconds: three short cards, then a three-question quiz.
// `answer` is the index of the correct option and never leaves the server.
export const COURSES = [
  {
    id: 'stablecoins', title: 'What is a stablecoin?', topic: 'Web3', minutes: 1, reward: { symbol: 'AAPL', usd: 1 },
    cards: [
      { title: 'A digital dollar', body: 'A stablecoin is a crypto token designed to always be worth the same as a regular currency. USDT (Tether) aims to stay at exactly $1.' },
      { title: 'Why it stays at $1', body: 'Tether holds reserves, mostly US Treasury bills and cash, so every USDT can in principle be swapped back for one dollar.' },
      { title: 'Why Dollo uses it', body: 'Buying USDT is often the fastest way to move value into dollars. When you deposit USDT, Dollo credits your USD balance 1:1.' },
    ],
    quiz: [
      { q: 'What is 1 USDT designed to be worth?', options: ['$1', '₦1', 'Whatever Bitcoin is worth'], answer: 0 },
      { q: 'What keeps a stablecoin like USDT steady?', options: ['Luck', 'Reserves such as cash and Treasury bills', 'Mining'], answer: 1 },
      { q: 'You deposit 20 USDT into Dollo. What is added to your USD balance?', options: ['$18', '$20', 'It depends on the stock market'], answer: 1 },
    ],
  },
  {
    id: 'networks', title: 'TRC20 vs ERC20: pick the right network', topic: 'Web3', minutes: 1, reward: { symbol: 'NVDA', usd: 1 },
    cards: [
      { title: 'Same coin, different roads', body: 'USDT travels on several blockchains. TRC20 means the Tron network; ERC20 means Ethereum. The coin is the same, the road is different.' },
      { title: 'Fees and speed', body: 'Tron transfers usually cost about $1 and arrive in a minute or two. Ethereum can cost several dollars when the network is busy.' },
      { title: 'The golden rule', body: 'Always send on the network your deposit address was made for. A TRC20 address only receives TRC20 USDT. Sending on the wrong network can lose your money for good.' },
    ],
    quiz: [
      { q: 'What does TRC20 refer to?', options: ['The Tron network', 'A Nigerian bank code', 'An Ethereum wallet'], answer: 0 },
      { q: 'Which is usually cheaper for small deposits?', options: ['ERC20 (Ethereum)', 'TRC20 (Tron)', 'They always cost the same'], answer: 1 },
      { q: 'Your Dollo address is TRC20. Your exchange offers ERC20 only. What do you do?', options: ['Send it anyway', 'Switch to the ERC20 address in Dollo first', 'Send half and see'], answer: 1 },
    ],
  },
  {
    id: 'fractional', title: 'Owning a slice: fractional shares', topic: 'Stocks', minutes: 1, reward: { symbol: 'KO', usd: 1 },
    cards: [
      { title: 'You don’t need a whole share', body: 'One Microsoft share costs over $400. With fractional shares you can buy $5 of it and own about 0.012 of a share.' },
      { title: 'Same ups, same downs', body: 'If the share price rises 10%, your $5 slice becomes $5.50. If it falls 10%, it becomes $4.50. Size is smaller; the movement is the same.' },
      { title: 'Dividends too', body: 'When a company pays dividends, fractional owners receive their share of it, in proportion to the slice they hold.' },
    ],
    quiz: [
      { q: 'A share costs $400 and you invest $4. How much do you own?', options: ['0.01 shares', '1 share', '4 shares'], answer: 0 },
      { q: 'Your $10 slice rises 20%. What is it worth?', options: ['$10.20', '$12', '$20'], answer: 1 },
      { q: 'Do fractional owners get dividends?', options: ['No, never', 'Yes, in proportion to what they own', 'Only after owning one full share'], answer: 1 },
    ],
  },
  {
    id: 'snapshot', title: 'Reading a company in 60 seconds', topic: 'Stocks', minutes: 1, reward: { symbol: 'MSFT', usd: 1 },
    cards: [
      { title: 'Market cap = size', body: 'Market cap is the share price times every share in existence. It tells you how big the market thinks a company is. $1 trillion+ is the giants’ club.' },
      { title: 'Revenue growth = momentum', body: 'Revenue growth compares this year’s sales to last year’s. +20% means the company sold a fifth more. Negative means sales shrank.' },
      { title: 'Risk score = the ride', body: 'Dollo’s risk score (1–10) is based on how much the price usually swings. A 9 can jump or drop sharply in a single day; a 2 moves slowly.' },
    ],
    quiz: [
      { q: 'What does market cap tell you?', options: ['How big the company is', 'How much profit it made today', 'Its share price'], answer: 0 },
      { q: 'Revenue growth of −10% means…', options: ['Sales grew 10%', 'Sales shrank 10%', 'The share price fell 10%'], answer: 1 },
      { q: 'A stock with risk score 9 is likely to…', options: ['Barely move', 'Swing a lot day to day', 'Pay big dividends'], answer: 1 },
    ],
  },
  {
    id: 'insiders', title: 'What insider buying tells you', topic: 'Market intelligence', minutes: 1, reward: { symbol: 'V', usd: 1 },
    cards: [
      { title: 'Who are insiders?', body: 'Directors, top executives and large shareholders. In the US they must publicly report their trades within two business days.' },
      { title: 'Buying is the louder signal', body: 'Insiders sell for many reasons, like school fees or a new house. They usually buy for one: they think the price will go up.' },
      { title: 'A clue, not a promise', body: 'Insider buying is one piece of evidence. Insiders can be wrong too, so never put in more than you can afford to see fall.' },
    ],
    quiz: [
      { q: 'Which insider trade is usually the stronger signal?', options: ['A CEO selling', 'A CEO buying with their own money', 'Neither, ever'], answer: 1 },
      { q: 'How fast must US insiders report trades?', options: ['Within 2 business days', 'Within a year', 'They never report'], answer: 0 },
      { q: 'An insider bought shares. What should you do?', options: ['Invest everything immediately', 'Treat it as one clue among others', 'Sell all your stocks'], answer: 1 },
    ],
  },
];

export const BY_ID = Object.fromEntries(COURSES.map((c) => [c.id, c]));
