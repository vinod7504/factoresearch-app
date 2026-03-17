export const MUTUAL_FUND_CATEGORIES = [
  {
    id: "high-risk-high-returns",
    title: "High Risk High Returns",
    subtitle: "Aggressive funds for long-term wealth creation",
    icon: "trending-up-outline",
    funds: [
      {
        name: "Quant Small Cap Fund",
        amc: "Quant Mutual Fund",
        style: "Small Cap",
        risk: "Very High",
        minSip: "₹1,000"
      },
      {
        name: "Nippon India Small Cap Fund",
        amc: "Nippon India Mutual Fund",
        style: "Small Cap",
        risk: "Very High",
        minSip: "₹500"
      },
      {
        name: "Motilal Oswal Midcap Fund",
        amc: "Motilal Oswal Mutual Fund",
        style: "Mid Cap",
        risk: "Very High",
        minSip: "₹500"
      },
      {
        name: "SBI Contra Fund",
        amc: "SBI Mutual Fund",
        style: "Contra",
        risk: "Very High",
        minSip: "₹500"
      },
      {
        name: "Bandhan Small Cap Fund",
        amc: "Bandhan Mutual Fund",
        style: "Small Cap",
        risk: "Very High",
        minSip: "₹1,000"
      }
    ]
  },
  {
    id: "passive-investing",
    title: "Passive Investing",
    subtitle: "Low-cost index and ETF-style strategy",
    icon: "layers-outline",
    funds: [
      {
        name: "UTI Nifty 50 Index Fund",
        amc: "UTI Mutual Fund",
        style: "Nifty 50 Index",
        risk: "Moderately High",
        minSip: "₹500"
      },
      {
        name: "HDFC Index S&P BSE Sensex Fund",
        amc: "HDFC Mutual Fund",
        style: "Sensex Index",
        risk: "Moderately High",
        minSip: "₹100"
      },
      {
        name: "ICICI Prudential Nifty Next 50 Index Fund",
        amc: "ICICI Prudential Mutual Fund",
        style: "Nifty Next 50 Index",
        risk: "High",
        minSip: "₹100"
      },
      {
        name: "Motilal Oswal Nasdaq 100 FOF",
        amc: "Motilal Oswal Mutual Fund",
        style: "International Index FOF",
        risk: "Very High",
        minSip: "₹500"
      },
      {
        name: "SBI Nifty 500 Index Fund",
        amc: "SBI Mutual Fund",
        style: "Nifty 500 Index",
        risk: "High",
        minSip: "₹500"
      }
    ]
  },
  {
    id: "top-rated-schemes",
    title: "Top Rated Schemes",
    subtitle: "Well-known diversified schemes with track records",
    icon: "star-outline",
    funds: [
      {
        name: "Parag Parikh Flexi Cap Fund",
        amc: "PPFAS Mutual Fund",
        style: "Flexi Cap",
        risk: "Very High",
        minSip: "₹1,000"
      },
      {
        name: "Mirae Asset Large Cap Fund",
        amc: "Mirae Asset Mutual Fund",
        style: "Large Cap",
        risk: "Very High",
        minSip: "₹500"
      },
      {
        name: "HDFC Flexi Cap Fund",
        amc: "HDFC Mutual Fund",
        style: "Flexi Cap",
        risk: "Very High",
        minSip: "₹100"
      },
      {
        name: "ICICI Prudential Bluechip Fund",
        amc: "ICICI Prudential Mutual Fund",
        style: "Large Cap",
        risk: "Very High",
        minSip: "₹100"
      },
      {
        name: "SBI Magnum Midcap Fund",
        amc: "SBI Mutual Fund",
        style: "Mid Cap",
        risk: "Very High",
        minSip: "₹500"
      }
    ]
  },
  {
    id: "new-fund-offers",
    title: "New Fund Offers",
    subtitle: "NFO ideas to track and review before investing",
    icon: "sparkles-outline",
    funds: [
      {
        name: "NFO Watch: Multi Asset Allocation Fund",
        amc: "Category Tracker",
        style: "Multi Asset",
        risk: "Moderate to High",
        minSip: "Check AMC"
      },
      {
        name: "NFO Watch: Innovation & Technology Fund",
        amc: "Category Tracker",
        style: "Thematic",
        risk: "Very High",
        minSip: "Check AMC"
      },
      {
        name: "NFO Watch: Dividend Yield Fund",
        amc: "Category Tracker",
        style: "Equity Dividend",
        risk: "High",
        minSip: "Check AMC"
      },
      {
        name: "NFO Watch: Bharat Consumption Fund",
        amc: "Category Tracker",
        style: "Consumption Theme",
        risk: "Very High",
        minSip: "Check AMC"
      },
      {
        name: "NFO Watch: Dynamic Bond Fund",
        amc: "Category Tracker",
        style: "Debt Dynamic",
        risk: "Moderate",
        minSip: "Check AMC"
      }
    ]
  },
  {
    id: "high-returns",
    title: "High Returns",
    subtitle: "Historically strong performers across cycles",
    icon: "flash-outline",
    funds: [
      {
        name: "Nippon India Growth Fund",
        amc: "Nippon India Mutual Fund",
        style: "Large & Mid Cap",
        risk: "Very High",
        minSip: "₹500"
      },
      {
        name: "Kotak Emerging Equity Fund",
        amc: "Kotak Mutual Fund",
        style: "Large & Mid Cap",
        risk: "Very High",
        minSip: "₹100"
      },
      {
        name: "Canara Robeco Small Cap Fund",
        amc: "Canara Robeco Mutual Fund",
        style: "Small Cap",
        risk: "Very High",
        minSip: "₹1,000"
      },
      {
        name: "DSP Midcap Fund",
        amc: "DSP Mutual Fund",
        style: "Mid Cap",
        risk: "Very High",
        minSip: "₹500"
      },
      {
        name: "Invesco India Contra Fund",
        amc: "Invesco Mutual Fund",
        style: "Contra",
        risk: "Very High",
        minSip: "₹500"
      }
    ]
  }
];

export const getMutualFundCategoryById = (categoryId) => {
  return MUTUAL_FUND_CATEGORIES.find((item) => item.id === categoryId) || null;
};
