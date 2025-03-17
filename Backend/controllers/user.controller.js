const userModel = require("../models/user.model");
const userService = require("../services/user.service");
const { validationResult } = require("express-validator");
const blackListTokenModel = require("../models/blacklistToken.model");

module.exports.registerUser = async (req, res, next) => {
    try {
        // Validate request body
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.log("Validation Errors:", errors.array());
            return res.status(400).json({ errors: errors.array() });
        }

        const { fullname, email, password } = req.body;

        // Check if fullname is valid
        if (!fullname || typeof fullname !== "object" || !fullname.firstname) {
            return res.status(400).json({ message: "First name is required" });
        }

        // Check if user already exists
        const isUserAlready = await userModel.findOne({ email });
        if (isUserAlready) {
            return res.status(400).json({ message: "User already exists" });
        }

        // Hash password
        const hashedPassword = await userModel.hashPassword(password);

        // Create new user
        const user = await userService.createUser({
            firstname: fullname.firstname,
            lastname: fullname.lastname || "", // Ensure lastname exists
            email,
            password: hashedPassword,
        });

        // Generate token (Ensure function exists)
        if (!user.generateAuthToken) {
            console.error("generateAuthToken is not defined in user model");
            return res.status(500).json({ message: "Server error: Token generation failed" });
        }

        const token = user.generateAuthToken();

        console.log("User Created:", user);
        console.log("Generated Token:", token);

        res.status(201).json({ token, user });
    } catch (error) {
        console.error("Error in registerUser:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

module.exports.loginUser = async (req, res, next) => {
    try {
        // Validate request body
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.log("Validation Errors:", errors.array());
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password } = req.body;

        // Find user
        const user = await userModel.findOne({ email }).select("+password");
        if (!user) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        // Generate token
        if (!user.generateAuthToken) {
            console.error("generateAuthToken is not defined in user model");
            return res.status(500).json({ message: "Server error: Token generation failed" });
        }

        const token = user.generateAuthToken();

        // Securely store token in an HTTP-only cookie
        res.cookie("token", token, { httpOnly: true, secure: true });

        res.status(200).json({ token, user });
    } catch (error) {
        console.error("Error in loginUser:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

module.exports.getUserProfile = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized access" });
        }

        res.status(200).json(req.user);
    } catch (error) {
        console.error("Error in getUserProfile:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

module.exports.logoutUser = async (req, res, next) => {
    try {
        res.clearCookie("token");

        // Retrieve token from cookies or authorization header
        const token =
            req.cookies.token || (req.headers.authorization && req.headers.authorization.split(" ")[1]);

        if (!token) {
            return res.status(400).json({ message: "No token provided" });
        }

        // Blacklist the token
        await blackListTokenModel.create({ token });

        res.status(200).json({ message: "Logged out successfully" });
    } catch (error) {
        console.error("Error in logoutUser:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};
