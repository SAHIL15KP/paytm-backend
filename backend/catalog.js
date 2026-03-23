const quickActions = [
    {
        key: "scan-pay",
        title: "Scan & Pay",
        subtitle: "QR or merchant UPI collection",
        badge: "Instant",
        action: "service",
        category: "merchant",
        type: "merchant",
        actionable: true,
        defaultAmount: 399,
        promptLabel: "Merchant or UPI ID",
        placeholder: "bluecafe@pay"
    },
    {
        key: "send-money",
        title: "Send Money",
        subtitle: "Pay contacts, bank accounts, or UPI IDs",
        badge: "UPI",
        action: "transfer",
        category: "payments",
        type: "transfer",
        actionable: true
    },
    {
        key: "mobile-recharge",
        title: "Mobile Recharge",
        subtitle: "Jio, Airtel, Vi, BSNL",
        badge: "Cashback",
        action: "service",
        category: "recharge",
        type: "recharge",
        actionable: true,
        defaultAmount: 239,
        promptLabel: "Mobile number",
        placeholder: "9876543210"
    },
    {
        key: "electricity-bill",
        title: "Electricity Bill",
        subtitle: "Boards, discoms, and state utilities",
        badge: "Bill Pay",
        action: "service",
        category: "bill",
        type: "bill",
        actionable: true,
        defaultAmount: 1480,
        promptLabel: "Consumer number",
        placeholder: "ELEC-44001281"
    },
    {
        key: "flight-ticket",
        title: "Flight Tickets",
        subtitle: "Domestic and international sectors",
        badge: "Travel",
        action: "service",
        category: "travel",
        type: "travel",
        actionable: true,
        defaultAmount: 4899,
        promptLabel: "Route or passenger",
        placeholder: "DEL to BLR / Ananya"
    },
    {
        key: "digital-gold",
        title: "Digital Gold",
        subtitle: "Buy small-ticket 24K holdings",
        badge: "Wealth",
        action: "service",
        category: "wealth",
        type: "investment",
        actionable: true,
        defaultAmount: 1500,
        promptLabel: "Holding label",
        placeholder: "Long-term stack"
    }
];

const featureSections = [
    {
        id: "payments",
        title: "Payments",
        blurb: "Core UPI and daily payment workflows inspired by Paytm's consumer app.",
        items: [
            {
                key: "send-money",
                title: "Send Money",
                subtitle: "UPI, bank transfer, or saved contacts",
                badge: "UPI",
                action: "transfer",
                category: "payments",
                type: "transfer",
                actionable: true
            },
            {
                key: "scan-pay",
                title: "In-store QR Pay",
                subtitle: "Merchant QR checkout with wallet, bank, or UPI Lite",
                badge: "Instant",
                action: "service",
                category: "merchant",
                type: "merchant",
                actionable: true,
                defaultAmount: 399,
                promptLabel: "Merchant or UPI ID",
                placeholder: "cornerstore@pay"
            },
            {
                key: "online-payments",
                title: "Online Payments",
                subtitle: "Checkout flows for shopping and subscriptions",
                badge: "Checkout",
                action: "service",
                category: "merchant",
                type: "merchant",
                actionable: true,
                defaultAmount: 899,
                promptLabel: "Merchant name",
                placeholder: "Online order"
            },
            {
                key: "self-transfer",
                title: "Self Transfer",
                subtitle: "Move money between balances and tracked sources",
                badge: "Balance",
                action: "topup",
                category: "payments",
                type: "topup",
                actionable: true
            },
            {
                key: "upi-autopay",
                title: "UPI AutoPay",
                subtitle: "Recurring mandates and reminders",
                badge: "Auto",
                action: "info",
                category: "payments",
                type: "automation",
                actionable: false
            },
            {
                key: "rupay-upi",
                title: "RuPay on UPI",
                subtitle: "Tap card rails through your UPI identity",
                badge: "Cards",
                action: "info",
                category: "payments",
                type: "card",
                actionable: false
            }
        ]
    },
    {
        id: "recharges-bills",
        title: "Recharge & Bills",
        blurb: "Utility and recharge stack based on Paytm's home page categories.",
        items: [
            {
                key: "mobile-recharge",
                title: "Mobile Recharge",
                subtitle: "Prepaid and validity plans",
                badge: "Cashback",
                action: "service",
                category: "recharge",
                type: "recharge",
                actionable: true,
                defaultAmount: 239,
                promptLabel: "Mobile number",
                placeholder: "9876543210"
            },
            {
                key: "dth-recharge",
                title: "DTH Recharge",
                subtitle: "Dish TV, Airtel DTH, Tata Play",
                badge: "TV",
                action: "service",
                category: "recharge",
                type: "recharge",
                actionable: true,
                defaultAmount: 499,
                promptLabel: "Subscriber ID",
                placeholder: "DTH-111998"
            },
            {
                key: "fastag-recharge",
                title: "FASTag Recharge",
                subtitle: "Top up toll balance before the next trip",
                badge: "Road",
                action: "service",
                category: "recharge",
                type: "recharge",
                actionable: true,
                defaultAmount: 750,
                promptLabel: "Vehicle or FASTag ID",
                placeholder: "DL8CAF1234"
            },
            {
                key: "metro-recharge",
                title: "Metro Recharge",
                subtitle: "Recharge city metro smart cards",
                badge: "Transit",
                action: "service",
                category: "recharge",
                type: "recharge",
                actionable: true,
                defaultAmount: 300,
                promptLabel: "Metro card number",
                placeholder: "METRO-82390"
            },
            {
                key: "electricity-bill",
                title: "Electricity Bill",
                subtitle: "State boards and city distributors",
                badge: "Bill Pay",
                action: "service",
                category: "bill",
                type: "bill",
                actionable: true,
                defaultAmount: 1480,
                promptLabel: "Consumer number",
                placeholder: "ELEC-44001281"
            },
            {
                key: "water-bill",
                title: "Water Bill",
                subtitle: "Municipal and city water boards",
                badge: "Utility",
                action: "service",
                category: "bill",
                type: "bill",
                actionable: true,
                defaultAmount: 620,
                promptLabel: "Connection number",
                placeholder: "WATER-55820"
            },
            {
                key: "gas-cylinder",
                title: "Gas & Cylinder",
                subtitle: "Book LPG and pay piped-gas bills",
                badge: "Home",
                action: "service",
                category: "bill",
                type: "bill",
                actionable: true,
                defaultAmount: 1050,
                promptLabel: "Consumer ID",
                placeholder: "GAS-992811"
            },
            {
                key: "broadband-bill",
                title: "Broadband Bill",
                subtitle: "Fiber, wifi, and landline invoices",
                badge: "Internet",
                action: "service",
                category: "bill",
                type: "bill",
                actionable: true,
                defaultAmount: 1299,
                promptLabel: "Account number",
                placeholder: "BB-000451"
            },
            {
                key: "insurance-premium",
                title: "Insurance Premium",
                subtitle: "Renew health, motor, or life policies",
                badge: "Protection",
                action: "service",
                category: "bill",
                type: "bill",
                actionable: true,
                defaultAmount: 2499,
                promptLabel: "Policy number",
                placeholder: "POL-112233"
            },
            {
                key: "loan-emi",
                title: "Loan EMI",
                subtitle: "Pay monthly dues on partner loans",
                badge: "EMI",
                action: "service",
                category: "bill",
                type: "bill",
                actionable: true,
                defaultAmount: 6890,
                promptLabel: "Loan account",
                placeholder: "EMI-40091"
            },
            {
                key: "challan",
                title: "Traffic Challan",
                subtitle: "Track and clear e-challan dues",
                badge: "Govt",
                action: "service",
                category: "bill",
                type: "bill",
                actionable: true,
                defaultAmount: 1200,
                promptLabel: "Vehicle or challan ID",
                placeholder: "DL4CAT9999"
            }
        ]
    },
    {
        id: "travel",
        title: "Travel & Transit",
        blurb: "Booking surfaces built around flights, trains, buses, and corridor spending.",
        items: [
            {
                key: "flight-ticket",
                title: "Flight Tickets",
                subtitle: "Domestic fares with airline offers",
                badge: "Travel",
                action: "service",
                category: "travel",
                type: "travel",
                actionable: true,
                defaultAmount: 4899,
                promptLabel: "Route or passenger",
                placeholder: "DEL to BLR / Ananya"
            },
            {
                key: "intl-flight",
                title: "International Flights",
                subtitle: "Long-haul routes with forex-ready checkout",
                badge: "Intl",
                action: "service",
                category: "travel",
                type: "travel",
                actionable: true,
                defaultAmount: 18999,
                promptLabel: "Route or passport name",
                placeholder: "DEL to DXB / Aarav"
            },
            {
                key: "train-ticket",
                title: "Train Tickets",
                subtitle: "Search and book rail sectors fast",
                badge: "IRCTC",
                action: "service",
                category: "travel",
                type: "travel",
                actionable: true,
                defaultAmount: 1299,
                promptLabel: "Train route or passenger",
                placeholder: "NDLS to BCT / Nisha"
            },
            {
                key: "bus-ticket",
                title: "Bus Tickets",
                subtitle: "Sleeper and AC buses across cities",
                badge: "Road",
                action: "service",
                category: "travel",
                type: "travel",
                actionable: true,
                defaultAmount: 899,
                promptLabel: "Route or passenger",
                placeholder: "Jaipur to Delhi / Kunal"
            },
            {
                key: "toll-gate",
                title: "Toll Gate Recharge",
                subtitle: "Corridor-ready balance reloads",
                badge: "FAST",
                action: "service",
                category: "recharge",
                type: "recharge",
                actionable: true,
                defaultAmount: 500,
                promptLabel: "Vehicle number",
                placeholder: "HR26AB1234"
            }
        ]
    },
    {
        id: "credit",
        title: "Credit & Pay Later",
        blurb: "Cards, score, and deferred payment experiences available in Paytm's ecosystem.",
        items: [
            {
                key: "postpaid",
                title: "Postpaid",
                subtitle: "Track your credit line and current due",
                badge: "Credit",
                action: "info",
                category: "credit",
                type: "credit",
                actionable: false
            },
            {
                key: "credit-card",
                title: "Credit Cards",
                subtitle: "Explore co-branded card propositions",
                badge: "Card",
                action: "info",
                category: "credit",
                type: "credit",
                actionable: false
            },
            {
                key: "personal-loan",
                title: "Personal Loan",
                subtitle: "Quick disbursal and EMI tracking",
                badge: "Loan",
                action: "info",
                category: "credit",
                type: "credit",
                actionable: false
            },
            {
                key: "credit-report",
                title: "Free Credit Score",
                subtitle: "Health monitor for your credit profile",
                badge: "Score",
                action: "info",
                category: "credit",
                type: "credit",
                actionable: false
            },
            {
                key: "rent-credit-card",
                title: "Rent via Credit Card",
                subtitle: "Pay rent while managing cash flow",
                badge: "Rent",
                action: "service",
                category: "bill",
                type: "bill",
                actionable: true,
                defaultAmount: 16000,
                promptLabel: "Landlord or property ref",
                placeholder: "Rajat / Flat 705"
            }
        ]
    },
    {
        id: "wealth",
        title: "Wealth & Savings",
        blurb: "Investing and savings shelves inspired by Paytm Money and Paytm Gold links.",
        items: [
            {
                key: "digital-gold",
                title: "Digital Gold",
                subtitle: "Start buying with small-ticket amounts",
                badge: "24K",
                action: "service",
                category: "wealth",
                type: "investment",
                actionable: true,
                defaultAmount: 1500,
                promptLabel: "Holding label",
                placeholder: "Long-term stack"
            },
            {
                key: "stocks",
                title: "Stocks",
                subtitle: "Track equities and direct investing",
                badge: "Market",
                action: "info",
                category: "wealth",
                type: "investment",
                actionable: false
            },
            {
                key: "mutual-funds",
                title: "Mutual Funds",
                subtitle: "Goal-based SIP style allocation",
                badge: "SIP",
                action: "info",
                category: "wealth",
                type: "investment",
                actionable: false
            },
            {
                key: "ipo",
                title: "IPO",
                subtitle: "Watch upcoming public offerings",
                badge: "New",
                action: "info",
                category: "wealth",
                type: "investment",
                actionable: false
            },
            {
                key: "etf",
                title: "ETF",
                subtitle: "Diversified baskets for long-term themes",
                badge: "ETF",
                action: "info",
                category: "wealth",
                type: "investment",
                actionable: false
            },
            {
                key: "pension",
                title: "Pension (NPS)",
                subtitle: "Retirement-oriented planning surface",
                badge: "Retire",
                action: "info",
                category: "wealth",
                type: "investment",
                actionable: false
            }
        ]
    },
    {
        id: "business",
        title: "Business Suite",
        blurb: "Merchant tools based on Paytm for Business links and offline acceptance products.",
        items: [
            {
                key: "payment-gateway",
                title: "Payment Gateway",
                subtitle: "Collect payments on web and app checkouts",
                badge: "Business",
                action: "info",
                category: "business",
                type: "merchant",
                actionable: false
            },
            {
                key: "payment-links",
                title: "Payment Links",
                subtitle: "Generate sharable request links instantly",
                badge: "Link",
                action: "info",
                category: "business",
                type: "merchant",
                actionable: false
            },
            {
                key: "paytm-qr",
                title: "QR for Stores",
                subtitle: "Counter acceptance for walk-in customers",
                badge: "QR",
                action: "info",
                category: "business",
                type: "merchant",
                actionable: false
            },
            {
                key: "soundbox",
                title: "Soundbox",
                subtitle: "Audio confirmations for merchant receipts",
                badge: "Audio",
                action: "info",
                category: "business",
                type: "merchant",
                actionable: false
            },
            {
                key: "pos-billing",
                title: "POS Billing",
                subtitle: "All-in-one billing and storefront workflows",
                badge: "POS",
                action: "info",
                category: "business",
                type: "merchant",
                actionable: false
            },
            {
                key: "merchant-loan",
                title: "Merchant Loan",
                subtitle: "Working capital alongside settlements",
                badge: "Finance",
                action: "info",
                category: "business",
                type: "merchant",
                actionable: false
            }
        ]
    }
];

const offers = [
    {
        id: "offer-upi-lite",
        title: "UPI Lite boost",
        description: "Add money to UPI Lite and unlock a faster low-value payment lane in the demo.",
        tag: "2% cashback"
    },
    {
        id: "offer-travel",
        title: "Weekend fare drop",
        description: "Flight and bus bookings earn extra cashback this week.",
        tag: "Travel rewards"
    },
    {
        id: "offer-gold",
        title: "Gold accumulation streak",
        description: "Digital gold purchases add reward points on every buy.",
        tag: "Savings"
    },
    {
        id: "offer-bills",
        title: "Smart bill routing",
        description: "Pay utility bills with tracked history and quick search.",
        tag: "Bills"
    }
];

const travelDeals = [
    {
        id: "travel-del-blr",
        route: "Delhi to Bengaluru",
        fare: "From INR 4,899",
        note: "Morning sectors with airline discount simulation"
    },
    {
        id: "travel-mum-goi",
        route: "Mumbai to Goa",
        fare: "From INR 3,240",
        note: "Popular weekend route with flexible checkout"
    },
    {
        id: "travel-ndls-bct",
        route: "New Delhi to Mumbai",
        fare: "Train fares from INR 1,299",
        note: "Rail inventory style booking placeholder"
    }
];

const wealthSnapshot = [
    {
        id: "wealth-gold",
        title: "Digital Gold",
        value: "Track grams and rupee value",
        note: "Actionable in this demo"
    },
    {
        id: "wealth-sip",
        title: "Mutual Funds",
        value: "Goal buckets and SIP watchlist",
        note: "Showcased as an information surface"
    },
    {
        id: "wealth-nifty",
        title: "Equity Basket",
        value: "Stocks, ETF, and IPO shelves",
        note: "Displayed as watch modules"
    }
];

const creditProducts = [
    {
        id: "credit-postpaid",
        title: "Postpaid",
        note: "Track due amount and available limit",
        accent: "line-of-credit"
    },
    {
        id: "credit-score",
        title: "Credit Health",
        note: "Free score style overview",
        accent: "score"
    },
    {
        id: "credit-personal-loan",
        title: "Personal Loan",
        note: "Explore quick-apply style cards",
        accent: "loan"
    }
];

const businessTools = [
    {
        id: "biz-gateway",
        title: "Gateway",
        note: "API collections, links, and subscriptions"
    },
    {
        id: "biz-qr",
        title: "Merchant QR",
        note: "Counter payments and settlements"
    },
    {
        id: "biz-pos",
        title: "POS Stack",
        note: "Billing, soundbox, and storefront tools"
    }
];

function getAllFeatures() {
    const deduped = new Map();

    [...quickActions, ...featureSections.flatMap((section) => section.items)].forEach((feature) => {
        if (!deduped.has(feature.key)) {
            deduped.set(feature.key, feature);
        }
    });

    return Array.from(deduped.values());
}

function findFeatureByKey(key) {
    return getAllFeatures().find((feature) => feature.key === key);
}

function searchCatalog(query) {
    const normalized = String(query || "").trim().toLowerCase();

    if (!normalized) {
        return {
            services: [],
            offers: []
        };
    }

    const services = getAllFeatures()
        .filter((feature) => {
            const searchable = [
                feature.title,
                feature.subtitle,
                feature.badge,
                feature.category,
                feature.type
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            return searchable.includes(normalized);
        })
        .slice(0, 8);

    const matchedOffers = offers
        .filter((offer) => {
            const searchable = [offer.title, offer.description, offer.tag]
                .join(" ")
                .toLowerCase();

            return searchable.includes(normalized);
        })
        .slice(0, 4);

    return {
        services,
        offers: matchedOffers
    };
}

module.exports = {
    quickActions,
    featureSections,
    offers,
    travelDeals,
    wealthSnapshot,
    creditProducts,
    businessTools,
    getAllFeatures,
    findFeatureByKey,
    searchCatalog
};
