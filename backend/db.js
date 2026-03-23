const mongoose = require("mongoose");
const { MONGOOSE_URL } = require("./config");

mongoose.set("strictQuery", true);

if (MONGOOSE_URL) {
    mongoose
        .connect(MONGOOSE_URL)
        .then(() => {
            console.log("MongoDB connected");
        })
        .catch((error) => {
            console.error("MongoDB connection error:", error.message);
        });
} else {
    console.warn("MONGOOSE_URL is not set. Backend APIs will not persist data until it is configured.");
}

const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
            minlength: 3,
            maxlength: 100
        },
        password: {
            type: String,
            required: true,
            minlength: 6
        },
        firstName: {
            type: String,
            required: true,
            trim: true,
            maxlength: 50
        },
        lastName: {
            type: String,
            required: true,
            trim: true,
            maxlength: 50
        },
        mobileNumber: {
            type: String,
            trim: true,
            default: ""
        },
        city: {
            type: String,
            trim: true,
            default: "New Delhi"
        },
        upiId: {
            type: String,
            trim: true,
            lowercase: true,
            unique: true,
            sparse: true
        }
    },
    {
        timestamps: true
    }
);

const accountSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true,
            index: true
        },
        balance: {
            type: Number,
            default: 0
        },
        walletBalance: {
            type: Number,
            default: 0
        },
        bankBalance: {
            type: Number,
            default: 0
        },
        upiLiteBalance: {
            type: Number,
            default: 0
        },
        postpaidLimit: {
            type: Number,
            default: 0
        },
        postpaidUsed: {
            type: Number,
            default: 0
        },
        rewardPoints: {
            type: Number,
            default: 0
        },
        cashbackEarned: {
            type: Number,
            default: 0
        },
        totalSpent: {
            type: Number,
            default: 0
        },
        totalReceived: {
            type: Number,
            default: 0
        },
        totalTransactions: {
            type: Number,
            default: 0
        },
        monthlySpendTarget: {
            type: Number,
            default: 25000
        }
    },
    {
        timestamps: true
    }
);

const activitySchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },
        type: {
            type: String,
            required: true
        },
        direction: {
            type: String,
            enum: ["credit", "debit", "neutral"],
            default: "debit"
        },
        title: {
            type: String,
            required: true,
            trim: true
        },
        subtitle: {
            type: String,
            default: "",
            trim: true
        },
        amount: {
            type: Number,
            required: true
        },
        source: {
            type: String,
            default: "bank"
        },
        status: {
            type: String,
            enum: ["completed", "processing", "scheduled"],
            default: "completed"
        },
        category: {
            type: String,
            required: true
        },
        counterparty: {
            type: String,
            default: ""
        },
        reference: {
            type: String,
            required: true,
            unique: true
        },
        latencyNs: {
            type: Number,
            default: 0
        },
        hidden: {
            type: Boolean,
            default: false
        },
        metadata: {
            type: mongoose.Schema.Types.Mixed,
            default: {}
        }
    },
    {
        timestamps: true
    }
);

activitySchema.index({ userId: 1, createdAt: -1 });

const User = mongoose.model("User", userSchema);
const Account = mongoose.model("Account", accountSchema);
const Activity = mongoose.model("Activity", activitySchema);

module.exports = {
    User,
    Account,
    Activity
};
