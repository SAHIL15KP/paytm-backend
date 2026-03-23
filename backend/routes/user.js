const crypto = require("crypto");
const express = require("express");
const jwt = require("jsonwebtoken");
const zod = require("zod");
const { User, Account, Activity } = require("../db");
const { JWT_SECRET } = require("../config");
const { authMiddleware } = require("../middleware");

const router = express.Router();

const signupBody = zod.object({
    username: zod.string().email(),
    firstName: zod.string().min(2).max(50),
    lastName: zod.string().min(1).max(50),
    password: zod.string().min(6).max(100),
    mobileNumber: zod.string().min(10).max(15).optional().or(zod.literal("")),
    city: zod.string().min(2).max(40).optional().or(zod.literal(""))
});

const signinBody = zod.object({
    username: zod.string().email(),
    password: zod.string().min(6).max(100)
});

const updateBody = zod.object({
    firstName: zod.string().min(2).max(50).optional(),
    lastName: zod.string().min(1).max(50).optional(),
    mobileNumber: zod.string().min(10).max(15).optional().or(zod.literal("")),
    city: zod.string().min(2).max(40).optional().or(zod.literal("")),
    password: zod.string().min(6).max(100).optional()
});

function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString("hex");
    const derivedKey = crypto.scryptSync(password, salt, 64).toString("hex");

    return `${salt}:${derivedKey}`;
}

function verifyPassword(password, storedPassword) {
    if (!storedPassword.includes(":")) {
        return password === storedPassword;
    }

    const [salt, key] = storedPassword.split(":");
    const hashedBuffer = crypto.scryptSync(password, salt, 64);
    const storedBuffer = Buffer.from(key, "hex");

    if (hashedBuffer.length !== storedBuffer.length) {
        return false;
    }

    return crypto.timingSafeEqual(hashedBuffer, storedBuffer);
}

async function buildUniqueUpiId(firstName, lastName, username) {
    const baseHandle = `${firstName}${lastName}`
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "")
        .slice(0, 14) || username.split("@")[0].replace(/[^a-z0-9]/g, "");

    let suffix = 0;

    while (suffix < 20) {
        const candidate = `${baseHandle}${suffix === 0 ? "" : suffix}@payflow`;
        const existingUser = await User.findOne({ upiId: candidate });

        if (!existingUser) {
            return candidate;
        }

        suffix += 1;
    }

    return `${baseHandle}${Date.now().toString(36)}@payflow`;
}

function makeReference(prefix) {
    const randomPart = crypto.randomBytes(3).toString("hex").toUpperCase();
    return `${prefix}-${Date.now().toString(36).toUpperCase()}-${randomPart}`;
}

function buildToken(userId) {
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" });
}

function serializeUser(user) {
    return {
        id: user._id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        mobileNumber: user.mobileNumber || "",
        city: user.city || "New Delhi",
        upiId: user.upiId || `${String(user.firstName || "pay").toLowerCase()}${String(user._id).slice(-4)}@payflow`
    };
}

router.post("/signup", async (req, res) => {
    const parsedBody = signupBody.safeParse(req.body);

    if (!parsedBody.success) {
        return res.status(400).json({
            message: "Please enter valid signup details."
        });
    }

    const { username, firstName, lastName, password, mobileNumber, city } = parsedBody.data;

    const existingUser = await User.findOne({ username });

    if (existingUser) {
        return res.status(409).json({
            message: "An account with this email already exists."
        });
    }

    const upiId = await buildUniqueUpiId(firstName, lastName, username);
    const starterCashback = 250;
    const user = await User.create({
        username,
        password: hashPassword(password),
        firstName,
        lastName,
        mobileNumber: mobileNumber || "",
        city: city || "New Delhi",
        upiId
    });

    const account = await Account.create({
        userId: user._id,
        balance: 7850,
        walletBalance: 7850,
        bankBalance: 165000,
        upiLiteBalance: 2200,
        postpaidLimit: 15000,
        postpaidUsed: 0,
        rewardPoints: 320,
        cashbackEarned: starterCashback,
        totalSpent: 0,
        totalReceived: starterCashback,
        totalTransactions: 1,
        monthlySpendTarget: 25000
    });

    await Activity.create({
        userId: user._id,
        type: "reward",
        direction: "credit",
        title: "Welcome cashback",
        subtitle: "Starter reward for activating your super app wallet",
        amount: starterCashback,
        source: "reward",
        status: "completed",
        category: "reward",
        counterparty: "PayFlow",
        reference: makeReference("RWD"),
        latencyNs: 0,
        hidden: false,
        metadata: {
            reason: "signup",
            walletBalance: account.walletBalance
        }
    });

    return res.status(201).json({
        message: "User created successfully",
        token: buildToken(user._id),
        user: serializeUser(user)
    });
});

router.post("/signin", async (req, res) => {
    const parsedBody = signinBody.safeParse(req.body);

    if (!parsedBody.success) {
        return res.status(400).json({
            message: "Please enter a valid email and password."
        });
    }

    const user = await User.findOne({ username: parsedBody.data.username });

    if (!user || !verifyPassword(parsedBody.data.password, user.password)) {
        return res.status(401).json({
            message: "Incorrect email or password."
        });
    }

    if (!user.password.includes(":")) {
        user.password = hashPassword(parsedBody.data.password);
        await user.save();
    }

    return res.json({
        token: buildToken(user._id),
        user: serializeUser(user)
    });
});

router.get("/me", authMiddleware, async (req, res) => {
    const user = await User.findById(req.userId);

    if (!user) {
        return res.status(404).json({
            message: "User not found."
        });
    }

    return res.json({
        user: serializeUser(user)
    });
});

router.put("/", authMiddleware, async (req, res) => {
    const parsedBody = updateBody.safeParse(req.body);

    if (!parsedBody.success) {
        return res.status(400).json({
            message: "Please submit valid profile details."
        });
    }

    const nextData = { ...parsedBody.data };

    if (nextData.password) {
        nextData.password = hashPassword(nextData.password);
    }

    const updatedUser = await User.findByIdAndUpdate(req.userId, nextData, {
        new: true
    });

    return res.json({
        message: "Profile updated successfully.",
        user: serializeUser(updatedUser)
    });
});

router.get("/bulk", async (req, res) => {
    const filter = String(req.query.filter || "").trim();
    const regex = new RegExp(filter, "i");
    const users = await User.find({
        $or: [
            { firstName: regex },
            { lastName: regex },
            { username: regex },
            { upiId: regex }
        ]
    })
        .select("username firstName lastName upiId city")
        .limit(12);

    return res.json({
        users: users.map((user) => ({
            _id: user._id,
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            upiId: user.upiId,
            city: user.city || "New Delhi"
        }))
    });
});

module.exports = router;
