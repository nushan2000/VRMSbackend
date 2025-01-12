const JWT = require("jsonwebtoken");
const UserSession  = require("../model/userSession");

const auth = (req, res, next) => {
   try {
      const authHeader = req.headers.authorization;

      if (!authHeader?.startsWith("Bearer ")) {
         return res.status(401).json({
            success: false,
            message: "Unauthorized: Token not provided",
            data: null,
         });
      }
      // Extract the token from the Authorization header
      const token = authHeader.split(" ")[1];

      JWT.verify(token, process.env.JWT_SECRET, async (err, user) => {
         if (err)
            return res.status(403).json({
               success: false,
               message: "Unauthorized: Failed to verify token",
               data: err,
            });

         // Check if there's an active session matching the token
         const session = await UserSession.findOne({ token,});
         if (!session) {
            return res.status(401).json({
               success: false,
               message: "Unauthorized: Session expired!",
               data: null,
            });
         }
         // Check if session has expired
         const currentTime = new Date();
         const lastActivityTime = new Date(session.lastActivityTime);
         const timeDifference = (currentTime - lastActivityTime) / (1000 * 60); // Difference in minutes
         const sessionExpirationTime = 45; // Session expiration time in minutes
         if (timeDifference > sessionExpirationTime) {
            // remove device ID and pushId from user
            const inputs = { pushId: "", deviceId: "" };
            const filters = { _id: user.userId };
            await PlatformUser.findOneAndUpdate(filters, inputs);

            session.isActive = false;
            await session.save();
            return res.status(401).json({
               success: false,
               message: "Session has expired",
               data: null,
            });
         }
         // Update lastActivityTime
         session.lastActivityTime = Date.now();
         await session.save();
         req.user = user;
         next();
      });
   } catch (err) {
      console.error("Error in auth middleware:", err);
      return res.status(500).json({ msg: "Internal Server Error" });
   }
};

module.exports = auth;

