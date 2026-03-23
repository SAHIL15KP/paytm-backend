const crypto = require("crypto");
const express = require("express");
const zod = require("zod");
const { authMiddleware } = require("../middleware");
const { Account, Activity, User } = require("../db");
const {
    quickActions,
    featureSections,
    offers,
    travelDeals,
    wealthSnapshot,
    creditProducts,
    businessTools,
    findFeatureByKey,
    searchCatalog
} = require("../catalog");

const router = express.Router();

const DEFAULT_ACCOUNT_STATE = {
    walletBalance: 7850,
    bankBalance: 165000,
    upiLiteBalance: 2200,
    postpaidLimit: 15000,
    postpaidUsed: 0,
    rewardPoints: 320,
    cashbackEarned: 250,
    totalSpent: 0,
    totalReceived: 250,
    totalTransactions: 1,
    monthlySpendTarget: 25000
};

const FUNDING_FIELD_MAP = {
    wallet: "walletBalance",
    bank: "bankBalance",
    upiLite: "upiLiteBalance"
};

const transferBody = zod.object({
    amount: zod.union([zod.number(), zod.string()]),
    to: zod.string().optional(),
    recipientName: zod.string().max(80).optional(),
    recipientHandle: zod.string().max(120).optional(),
    note: zod.string().max(80).optional(),
    source: zod.enum(["wallet", "bank", "upiLite"]).optional()
});

const topupBody = zod.object({
    amount: zod.union([zod.number(), zod.string()]),
    destination: zod.enum(["wallet", "upiLite"]).optional()
});

const serviceBody = zod.object({
    featureKey: zod.string().min(2),
    amount: zod.union([zod.number(), zod.string()]).optional(),
    provider: zod.string().max(120).optional(),
    accountRef: zod.string().max(120).optional(),
    note: zod.string().max(100).optional(),
    source: zod.enum(["wallet", "bank", "upiLite", "postpaid"]).optional()
});

const visibilityBody = zod.object({
    hidden: zod.boolean()
});

function toAmount(value) {
    const amount = Number(value);

    if (!Number.isFinite(amount)) {
        return null;
    }

    return Math.round(amount * 100) / 100;
}

function formatAmount(value) {
    return Number(value || 0).toLocaleString("en-IN", {
        maximumFractionDigits: 2
    });
}

function createReference(prefix) {
    const randomPart = crypto.randomBytes(3).toString("hex").toUpperCase();
    return `${prefix}-${Date.now().toString(36).toUpperCase()}-${randomPart}`;
}

function buildInitials(user) {
    return `${String(user.firstName || "").slice(0, 1)}${String(user.lastName || "").slice(0, 1)}`
        .toUpperCase()
        .trim() || "PF";
}

function displayUpiId(user) {
    return user.upiId || `${String(user.firstName || "pay").toLowerCase()}${String(user._id).slice(-4)}@payflow`;
}

function activitySubtitle(parts) {
    return parts.filter(Boolean).join(" | ");
}

async function ensureAccount(userId) {
    let account = await Account.findOne({ userId });

    if (!account) {
        account = await Account.create({
            userId,
            balance: DEFAULT_ACCOUNT_STATE.walletBalance,
            ...DEFAULT_ACCOUNT_STATE
        });

        return account;
    }

    let dirty = false;
    Object.entries(DEFAULT_ACCOUNT_STATE).forEach(([field, fallback]) => {
        if (typeof account[field] !== "number" || Number.isNaN(account[field])) {
            if (field === "walletBalance" && typeof account.balance === "number") {
                account[field] = account.balance;
            } else {
                account[field] = fallback;
            }

            dirty = true;
        }
    });

    if (account.balance !== account.walletBalance) {
        account.balance = account.walletBalance;
        dirty = true;
    }

    if (dirty) {
        await account.save();
    }

    return account;
}

function serializeActivity(activity) {
    return {
        id: String(activity._id),
        type: activity.type,
        direction: activity.direction,
        title: activity.title,
        subtitle: activity.subtitle,
        amount: activity.amount,
        source: activity.source,
        status: activity.status,
        category: activity.category,
        counterparty: activity.counterparty,
        reference: activity.reference,
        latencyNs: activity.latencyNs || 0,
        hidden: Boolean(activity.hidden),
        metadata: activity.metadata || {},
        createdAt: activity.createdAt
    };
}

function monthKey(date) {
    return `${date.getFullYear()}-${date.getMonth()}`;
}

function dayKey(date) {
    return date.toISOString().slice(0, 10);
}

function buildAnalytics(activities) {
    const now = new Date();
    const currentMonth = monthKey(now);
    const visibleActivities = activities.filter((activity) => !activity.hidden);
    const monthlyActivities = visibleActivities.filter(
        (activity) => monthKey(new Date(activity.createdAt)) === currentMonth
    );
    const monthlyDebits = monthlyActivities.filter(
        (activity) => activity.direction === "debit" && activity.status === "completed"
    );
    const monthlyCredits = monthlyActivities.filter(
        (activity) => activity.direction === "credit" && activity.status === "completed"
    );

    const spendByCategory = monthlyDebits.reduce((accumulator, activity) => {
        const currentValue = accumulator[activity.category] || 0;
        accumulator[activity.category] = currentValue + activity.amount;
        return accumulator;
    }, {});

    const totalSpend = monthlyDebits.reduce((sum, activity) => sum + activity.amount, 0);
    const totalReceived = monthlyCredits.reduce((sum, activity) => sum + activity.amount, 0);
    const topCategories = Object.entries(spendByCategory)
        .sort((left, right) => right[1] - left[1])
        .slice(0, 5)
        .map(([category, spent]) => ({
            category,
            label: category.replace(/(^|-)([a-z])/g, (_, separator, character) =>
                `${separator === "-" ? " " : ""}${character.toUpperCase()}`
            ),
            spent,
            share: totalSpend > 0 ? spent / totalSpend : 0
        }));

    const fastestLatencyNs = visibleActivities.reduce((fastest, activity) => {
        if (!activity.latencyNs) {
            return fastest;
        }

        if (!fastest) {
            return activity.latencyNs;
        }

        return Math.min(fastest, activity.latencyNs);
    }, 0);

    const lastSevenDays = Array.from({ length: 7 }, (_, index) => {
        const date = new Date(now);
        date.setDate(now.getDate() - (6 - index));
        const key = dayKey(date);
        const amount = visibleActivities
            .filter(
                (activity) =>
                    activity.direction === "debit" &&
                    dayKey(new Date(activity.createdAt)) === key &&
                    !activity.hidden
            )
            .reduce((sum, activity) => sum + activity.amount, 0);

        return {
            label: date.toLocaleDateString("en-IN", { weekday: "short" }),
            amount
        };
    });

    return {
        monthlySpend: totalSpend,
        monthlyReceived: totalReceived,
        hiddenCount: activities.filter((activity) => activity.hidden).length,
        totalTransactions: visibleActivities.length,
        fastestLatencyNs,
        averageTicketSize: monthlyDebits.length ? totalSpend / monthlyDebits.length : 0,
        topCategories,
        weeklySpend: lastSevenDays
    };
}

function rewardDetails(featureKey, amount) {
    const rewardConfig = {
        "scan-pay": { rate: 0.02, cap: 80 },
        "mobile-recharge": { rate: 0.05, cap: 120 },
        "electricity-bill": { rate: 0.03, cap: 150 },
        "flight-ticket": { rate: 0.04, cap: 250 },
        "train-ticket": { rate: 0.02, cap: 100 },
        "bus-ticket": { rate: 0.03, cap: 90 },
        "digital-gold": { rate: 0.01, cap: 200 },
        "fastag-recharge": { rate: 0.03, cap: 120 },
        "metro-recharge": { rate: 0.02, cap: 80 },
        "dth-recharge": { rate: 0.03, cap: 100 },
        "water-bill": { rate: 0.02, cap: 75 },
        "broadband-bill": { rate: 0.02, cap: 110 }
    };

    const config = rewardConfig[featureKey];
    const cashback = config ? Math.min(Math.round(amount * config.rate), config.cap) : 0;
    const rewardPoints = Math.max(12, Math.round(amount / 20));

    return {
        cashback,
        rewardPoints
    };
}

async function buildDashboard(userId) {
    const [user, activities, contacts] = await Promise.all([
        User.findById(userId).lean(),
        Activity.find({ userId }).sort({ createdAt: -1 }).limit(50).lean(),
        User.find({ _id: { $ne: userId } })
            .select("firstName lastName username upiId city")
            .limit(6)
            .lean()
    ]);

    if (!user) {
        return null;
    }

    const account = await ensureAccount(userId);
    const analytics = buildAnalytics(activities);
    const goldInvested = activities
        .filter(
            (activity) =>
                activity.direction === "debit" &&
                activity.metadata &&
                activity.metadata.featureKey === "digital-gold"
        )
        .reduce((sum, activity) => sum + activity.amount, 0);

    return {
        profile: {
            id: String(user._id),
            firstName: user.firstName,
            lastName: user.lastName,
            username: user.username,
            mobileNumber: user.mobileNumber || "",
            city: user.city || "New Delhi",
            upiId: displayUpiId(user),
            initials: buildInitials(user),
            memberSince: user.createdAt
        },
        account: {
            walletBalance: account.walletBalance,
            bankBalance: account.bankBalance,
            upiLiteBalance: account.upiLiteBalance,
            postpaidLimit: account.postpaidLimit,
            postpaidUsed: account.postpaidUsed,
            postpaidAvailable: Math.max(account.postpaidLimit - account.postpaidUsed, 0),
            rewardPoints: account.rewardPoints,
            cashbackEarned: account.cashbackEarned,
            totalBalance: account.walletBalance + account.bankBalance + account.upiLiteBalance,
            totalSpent: account.totalSpent,
            totalReceived: account.totalReceived,
            totalTransactions: account.totalTransactions,
            monthlySpendTarget: account.monthlySpendTarget
        },
        analytics,
        quickActions,
        featureSections,
        offers,
        travelDeals,
        wealthSnapshot: wealthSnapshot.map((item) => {
            if (item.id === "wealth-gold") {
                return {
                    ...item,
                    value: `INR ${formatAmount(goldInvested || 1500)} invested`
                };
            }

            return item;
        }),
        creditProducts: creditProducts.map((item) => {
            if (item.id === "credit-postpaid") {
                return {
                    ...item,
                    note: `Due today: INR ${formatAmount(account.postpaidUsed)} | Available: INR ${formatAmount(
                        Math.max(account.postpaidLimit - account.postpaidUsed, 0)
                    )}`
                };
            }

            return item;
        }),
        businessTools,
        contacts: contacts.map((contact) => ({
            id: String(contact._id),
            firstName: contact.firstName,
            lastName: contact.lastName,
            username: contact.username,
            upiId: contact.upiId || `${contact.firstName.toLowerCase()}${String(contact._id).slice(-4)}@payflow`,
            city: contact.city || "New Delhi",
            initials: buildInitials(contact)
        })),
        activities: activities.map(serializeActivity)
    };
}

async function debitSource(account, source, amount) {
    if (source === "postpaid") {
        const availableLimit = Math.max(account.postpaidLimit - account.postpaidUsed, 0);

        if (availableLimit < amount) {
            return false;
        }

        account.postpaidUsed += amount;
        return true;
    }

    const field = FUNDING_FIELD_MAP[source];

    if (!field) {
        return false;
    }

    if (account[field] < amount) {
        return false;
    }

    account[field] -= amount;
    return true;
}

router.get("/bootstrap", authMiddleware, async (req, res) => {
    const dashboard = await buildDashboard(req.userId);

    if (!dashboard) {
        return res.status(404).json({
            message: "Unable to load dashboard."
        });
    }

    return res.json(dashboard);
});

router.get("/balance", authMiddleware, async (req, res) => {
    const account = await ensureAccount(req.userId);

    return res.json({
        walletBalance: account.walletBalance,
        bankBalance: account.bankBalance,
        upiLiteBalance: account.upiLiteBalance,
        totalBalance: account.walletBalance + account.bankBalance + account.upiLiteBalance,
        postpaidAvailable: Math.max(account.postpaidLimit - account.postpaidUsed, 0)
    });
});

router.get("/activity", authMiddleware, async (req, res) => {
    const includeHidden = String(req.query.includeHidden || "true") === "true";
    const activities = await Activity.find({
        userId: req.userId,
        ...(includeHidden ? {} : { hidden: false })
    })
        .sort({ createdAt: -1 })
        .limit(100)
        .lean();

    return res.json({
        activities: activities.map(serializeActivity)
    });
});

router.get("/search", authMiddleware, async (req, res) => {
    const query = String(req.query.q || "").trim();

    if (query.length < 2) {
        return res.json({
            contacts: [],
            services: [],
            offers: [],
            activities: []
        });
    }

    const regex = new RegExp(query, "i");
    const [contacts, activities] = await Promise.all([
        User.find({
            _id: { $ne: req.userId },
            $or: [{ firstName: regex }, { lastName: regex }, { username: regex }, { upiId: regex }]
        })
            .select("firstName lastName username upiId city")
            .limit(5)
            .lean(),
        Activity.find({
            userId: req.userId,
            $or: [{ title: regex }, { subtitle: regex }, { counterparty: regex }, { reference: regex }]
        })
            .sort({ createdAt: -1 })
            .limit(5)
            .lean()
    ]);

    const catalogResults = searchCatalog(query);

    return res.json({
        contacts: contacts.map((contact) => ({
            id: String(contact._id),
            firstName: contact.firstName,
            lastName: contact.lastName,
            username: contact.username,
            upiId: contact.upiId || `${contact.firstName.toLowerCase()}${String(contact._id).slice(-4)}@payflow`,
            city: contact.city || "New Delhi",
            initials: buildInitials(contact)
        })),
        services: catalogResults.services,
        offers: catalogResults.offers,
        activities: activities.map(serializeActivity)
    });
});

router.patch("/activity/:activityId/visibility", authMiddleware, async (req, res) => {
    const parsedBody = visibilityBody.safeParse(req.body);

    if (!parsedBody.success) {
        return res.status(400).json({
            message: "Invalid visibility payload."
        });
    }

    const activity = await Activity.findOneAndUpdate(
        { _id: req.params.activityId, userId: req.userId },
        { hidden: parsedBody.data.hidden },
        { new: true }
    );

    if (!activity) {
        return res.status(404).json({
            message: "Activity not found."
        });
    }

    return res.json({
        message: parsedBody.data.hidden ? "Payment hidden from the main feed." : "Payment restored to the main feed.",
        activity: serializeActivity(activity)
    });
});

router.post("/topup", authMiddleware, async (req, res) => {
    const parsedBody = topupBody.safeParse(req.body);

    if (!parsedBody.success) {
        return res.status(400).json({
            message: "Invalid add-money request."
        });
    }

    const startNs = process.hrtime.bigint();
    const amount = toAmount(parsedBody.data.amount);
    const destination = parsedBody.data.destination || "wallet";

    if (!amount || amount <= 0) {
        return res.status(400).json({
            message: "Enter a valid amount."
        });
    }

    const account = await ensureAccount(req.userId);

    if (account.bankBalance < amount) {
        return res.status(400).json({
            message: "Not enough linked bank balance to add money."
        });
    }

    account.bankBalance -= amount;

    if (destination === "wallet") {
        account.walletBalance += amount;
    } else {
        account.upiLiteBalance += amount;
    }

    account.totalTransactions += 1;
    account.balance = account.walletBalance;
    await account.save();

    const latencyNs = Number(process.hrtime.bigint() - startNs);
    const activity = await Activity.create({
        userId: req.userId,
        type: "topup",
        direction: "credit",
        title: destination === "wallet" ? "Wallet add money" : "UPI Lite top-up",
        subtitle: "Funded from linked bank account",
        amount,
        source: "bank",
        status: "completed",
        category: destination === "wallet" ? "wallet" : "upi-lite",
        counterparty: "Self",
        reference: createReference("TOP"),
        latencyNs,
        hidden: false,
        metadata: {
            destination
        }
    });

    return res.json({
        message: destination === "wallet" ? "Money added to your wallet." : "UPI Lite topped up.",
        reference: activity.reference,
        latencyNs
    });
});

router.post("/transfer", authMiddleware, async (req, res) => {
    const parsedBody = transferBody.safeParse(req.body);

    if (!parsedBody.success) {
        return res.status(400).json({
            message: "Invalid transfer request."
        });
    }

    const startNs = process.hrtime.bigint();
    const amount = toAmount(parsedBody.data.amount);
    const source = parsedBody.data.source || "bank";

    if (!amount || amount <= 0) {
        return res.status(400).json({
            message: "Enter a valid amount."
        });
    }

    if (source === "upiLite" && amount > 4000) {
        return res.status(400).json({
            message: "UPI Lite payments are capped at INR 4,000 in this demo."
        });
    }

    const [sender, account] = await Promise.all([
        User.findById(req.userId),
        ensureAccount(req.userId)
    ]);

    if (!sender) {
        return res.status(404).json({
            message: "Sender not found."
        });
    }

    const debited = await debitSource(account, source, amount);

    if (!debited) {
        return res.status(400).json({
            message: "Insufficient balance for this transfer."
        });
    }

    let recipientUser = null;
    let recipientAccount = null;

    if (parsedBody.data.to) {
        recipientUser = await User.findById(parsedBody.data.to);

        if (recipientUser && String(recipientUser._id) !== String(req.userId)) {
            recipientAccount = await ensureAccount(recipientUser._id);
        }
    }

    const recipientName =
        (recipientUser && `${recipientUser.firstName} ${recipientUser.lastName}`.trim()) ||
        parsedBody.data.recipientName ||
        parsedBody.data.recipientHandle;

    if (!recipientName) {
        return res.status(400).json({
            message: "Choose a contact or enter a recipient name."
        });
    }

    const reference = createReference("UPI");
    account.totalSpent += amount;
    account.totalTransactions += 1;
    account.balance = account.walletBalance;
    await account.save();

    if (recipientAccount) {
        const recipientField = source === "wallet" ? "walletBalance" : "bankBalance";
        recipientAccount[recipientField] += amount;
        recipientAccount.totalReceived += amount;
        recipientAccount.totalTransactions += 1;
        recipientAccount.balance = recipientAccount.walletBalance;
        await recipientAccount.save();
    }

    const latencyNs = Number(process.hrtime.bigint() - startNs);

    await Activity.create({
        userId: req.userId,
        type: "transfer",
        direction: "debit",
        title: "UPI transfer",
        subtitle: activitySubtitle([
            parsedBody.data.note || `Sent to ${recipientName}`,
            parsedBody.data.recipientHandle
        ]),
        amount,
        source,
        status: "completed",
        category: "payments",
        counterparty: recipientName,
        reference,
        latencyNs,
        hidden: false,
        metadata: {
            internalRecipient: Boolean(recipientUser),
            recipientHandle: parsedBody.data.recipientHandle || (recipientUser ? displayUpiId(recipientUser) : ""),
            note: parsedBody.data.note || ""
        }
    });

    if (recipientUser && recipientAccount) {
        await Activity.create({
            userId: recipientUser._id,
            type: "transfer",
            direction: "credit",
            title: "Money received",
            subtitle: `From ${sender.firstName} ${sender.lastName}`.trim(),
            amount,
            source: source === "wallet" ? "wallet" : "bank",
            status: "completed",
            category: "payments",
            counterparty: `${sender.firstName} ${sender.lastName}`.trim(),
            reference,
            latencyNs,
            hidden: false,
            metadata: {
                senderUpiId: displayUpiId(sender)
            }
        });
    }

    return res.json({
        message: `Payment sent to ${recipientName}.`,
        reference,
        latencyNs
    });
});

router.post("/service-payment", authMiddleware, async (req, res) => {
    const parsedBody = serviceBody.safeParse(req.body);

    if (!parsedBody.success) {
        return res.status(400).json({
            message: "Invalid service payment request."
        });
    }

    const feature = findFeatureByKey(parsedBody.data.featureKey);

    if (!feature || feature.action !== "service") {
        return res.status(404).json({
            message: "That feature is not available for payment yet."
        });
    }

    const startNs = process.hrtime.bigint();
    const amount = toAmount(parsedBody.data.amount || feature.defaultAmount || 0);
    const source = parsedBody.data.source || "wallet";

    if (!amount || amount <= 0) {
        return res.status(400).json({
            message: "Enter a valid amount."
        });
    }

    if (source === "upiLite" && amount > 4000) {
        return res.status(400).json({
            message: "UPI Lite payments are capped at INR 4,000 in this demo."
        });
    }

    const account = await ensureAccount(req.userId);
    const debited = await debitSource(account, source, amount);

    if (!debited) {
        return res.status(400).json({
            message: "Insufficient balance for this payment source."
        });
    }

    const rewards = rewardDetails(feature.key, amount);
    account.totalSpent += amount;
    account.totalTransactions += 1;
    account.rewardPoints += rewards.rewardPoints;

    if (rewards.cashback > 0) {
        account.walletBalance += rewards.cashback;
        account.cashbackEarned += rewards.cashback;
        account.totalReceived += rewards.cashback;
    }

    account.balance = account.walletBalance;
    await account.save();

    const latencyNs = Number(process.hrtime.bigint() - startNs);
    const reference = createReference(feature.category.slice(0, 3).toUpperCase());

    const paymentActivity = await Activity.create({
        userId: req.userId,
        type: feature.type,
        direction: "debit",
        title: feature.title,
        subtitle: activitySubtitle([
            parsedBody.data.provider || feature.subtitle,
            parsedBody.data.accountRef,
            parsedBody.data.note
        ]),
        amount,
        source,
        status: "completed",
        category: feature.category,
        counterparty: parsedBody.data.provider || feature.title,
        reference,
        latencyNs,
        hidden: false,
        metadata: {
            featureKey: feature.key,
            provider: parsedBody.data.provider || "",
            accountRef: parsedBody.data.accountRef || "",
            note: parsedBody.data.note || "",
            promptLabel: feature.promptLabel || ""
        }
    });

    if (rewards.cashback > 0) {
        await Activity.create({
            userId: req.userId,
            type: "reward",
            direction: "credit",
            title: "Cashback earned",
            subtitle: `Reward from ${feature.title}`,
            amount: rewards.cashback,
            source: "reward",
            status: "completed",
            category: "reward",
            counterparty: "PayFlow Rewards",
            reference: createReference("CBK"),
            latencyNs,
            hidden: false,
            metadata: {
                featureKey: feature.key,
                linkedReference: paymentActivity.reference
            }
        });
    }

    return res.json({
        message: `${feature.title} completed successfully.`,
        reference: paymentActivity.reference,
        latencyNs,
        cashback: rewards.cashback,
        rewardPoints: rewards.rewardPoints
    });
});

module.exports = router;
