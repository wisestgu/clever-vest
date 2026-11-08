// Reference data for the sandbox market. Prices are anchors for a deterministic simulation and are
// NOT live quotes; fundamentals are rounded, indicative figures for demo purposes.
// vol = typical daily move (fraction), beta = sensitivity to the overall market.
export const STOCKS = [
  { symbol: 'AAPL', name: 'Apple', sector: 'Technology', base: 228, marketCap: 3.45e12, revenueGrowth: 0.06, dividendYield: 0.0044, vol: 0.014, beta: 1.2,
    about: 'Makes the iPhone, Mac and services like the App Store and iCloud.' },
  { symbol: 'MSFT', name: 'Microsoft', sector: 'Technology', base: 418, marketCap: 3.1e12, revenueGrowth: 0.15, dividendYield: 0.0072, vol: 0.013, beta: 0.9,
    about: 'Sells Windows, Office and Azure cloud services, and is a major investor in AI.' },
  { symbol: 'NVDA', name: 'NVIDIA', sector: 'Technology', base: 138, marketCap: 3.35e12, revenueGrowth: 0.94, dividendYield: 0.0003, vol: 0.031, beta: 1.7,
    about: 'Designs the chips that power most AI models and gaming computers.' },
  { symbol: 'GOOGL', name: 'Alphabet', sector: 'Technology', base: 172, marketCap: 2.1e12, revenueGrowth: 0.14, dividendYield: 0.0047, vol: 0.017, beta: 1.0,
    about: 'Owns Google Search, YouTube, Android and Google Cloud.' },
  { symbol: 'AMZN', name: 'Amazon', sector: 'Consumer', base: 196, marketCap: 2.05e12, revenueGrowth: 0.11, dividendYield: 0, vol: 0.019, beta: 1.15,
    about: 'Runs the world’s largest online store and the AWS cloud platform.' },
  { symbol: 'META', name: 'Meta', sector: 'Technology', base: 567, marketCap: 1.43e12, revenueGrowth: 0.19, dividendYield: 0.0035, vol: 0.022, beta: 1.25,
    about: 'Owns Facebook, Instagram and WhatsApp, and earns mostly from advertising.' },
  { symbol: 'TSLA', name: 'Tesla', sector: 'Consumer', base: 251, marketCap: 8.0e11, revenueGrowth: 0.02, dividendYield: 0, vol: 0.038, beta: 2.0,
    about: 'Builds electric cars, home batteries and solar products.' },
  { symbol: 'AMD', name: 'AMD', sector: 'Technology', base: 152, marketCap: 2.46e11, revenueGrowth: 0.18, dividendYield: 0, vol: 0.029, beta: 1.65,
    about: 'Designs processors and graphics chips for PCs, game consoles and data centres.' },
  { symbol: 'KO', name: 'Coca-Cola', sector: 'Consumer Staples', base: 66, marketCap: 2.85e11, revenueGrowth: 0.03, dividendYield: 0.029, vol: 0.008, beta: 0.6,
    about: 'Sells Coca-Cola, Fanta, Sprite and hundreds of other drinks in 200+ countries.' },
  { symbol: 'JNJ', name: 'Johnson & Johnson', sector: 'Healthcare', base: 158, marketCap: 3.8e11, revenueGrowth: 0.05, dividendYield: 0.031, vol: 0.009, beta: 0.5,
    about: 'Makes prescription medicines and medical devices used in hospitals worldwide.' },
  { symbol: 'PG', name: 'Procter & Gamble', sector: 'Consumer Staples', base: 168, marketCap: 3.95e11, revenueGrowth: 0.02, dividendYield: 0.024, vol: 0.008, beta: 0.45,
    about: 'Makes household brands such as Pampers, Ariel, Oral-B and Gillette.' },
  { symbol: 'O', name: 'Realty Income', sector: 'Real Estate', base: 58, marketCap: 5.1e10, revenueGrowth: 0.27, dividendYield: 0.054, vol: 0.011, beta: 0.85,
    about: 'Owns thousands of shop and warehouse buildings and pays rent out to investors every month.' },
  { symbol: 'VZ', name: 'Verizon', sector: 'Telecoms', base: 42, marketCap: 1.77e11, revenueGrowth: 0.01, dividendYield: 0.063, vol: 0.010, beta: 0.4,
    about: 'One of the largest mobile and internet providers in the United States.' },
  { symbol: 'NEE', name: 'NextEra Energy', sector: 'Clean Energy', base: 76, marketCap: 1.56e11, revenueGrowth: 0.04, dividendYield: 0.027, vol: 0.014, beta: 0.6,
    about: 'The world’s largest producer of wind and solar power.' },
  { symbol: 'ENPH', name: 'Enphase Energy', sector: 'Clean Energy', base: 72, marketCap: 9.8e9, revenueGrowth: -0.31, dividendYield: 0, vol: 0.041, beta: 1.9,
    about: 'Makes the small inverters that connect rooftop solar panels to homes.' },
  { symbol: 'FSLR', name: 'First Solar', sector: 'Clean Energy', base: 196, marketCap: 2.1e10, revenueGrowth: 0.24, dividendYield: 0, vol: 0.033, beta: 1.4,
    about: 'Manufactures solar panels for large solar farms.' },
  { symbol: 'PLTR', name: 'Palantir', sector: 'Technology', base: 41, marketCap: 9.3e10, revenueGrowth: 0.27, dividendYield: 0, vol: 0.036, beta: 2.1,
    about: 'Builds data-analysis and AI software for governments and large companies.' },
  { symbol: 'V', name: 'Visa', sector: 'Financials', base: 290, marketCap: 5.6e11, revenueGrowth: 0.10, dividendYield: 0.0075, vol: 0.010, beta: 0.95,
    about: 'Runs the payment network behind billions of card transactions every year.' },
];

export const BY_SYMBOL = Object.fromEntries(STOCKS.map((s) => [s.symbol, s]));

export const COLLECTIONS = [
  { id: 'ai-revolution', name: 'AI Revolution', blurb: 'Companies building the chips, clouds and software behind artificial intelligence.',
    symbols: ['NVDA', 'MSFT', 'GOOGL', 'AMD', 'PLTR', 'META'] },
  { id: 'dividend-payers', name: 'Top Dividend Payers', blurb: 'Steady businesses that share profits with shareholders as regular cash payments.',
    symbols: ['O', 'VZ', 'KO', 'JNJ', 'PG'] },
  { id: 'clean-energy', name: 'Clean Energy', blurb: 'Solar, wind and the hardware that moves the world off fossil fuels.',
    symbols: ['NEE', 'FSLR', 'ENPH', 'TSLA'] },
  { id: 'everyday-brands', name: 'Brands You Already Use', blurb: 'The phones, drinks and apps you touch every day, now in your portfolio.',
    symbols: ['AAPL', 'KO', 'META', 'AMZN', 'V', 'PG'] },
];
