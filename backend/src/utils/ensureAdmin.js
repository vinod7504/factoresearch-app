const User = require("../models/User");

const buildFallbackPhone = () => {
  const stamp = String(Date.now()).slice(-9);
  return `9${stamp}`;
};

const ensureAdmin = async () => {
  const adminEmail = (process.env.ADMIN_EMAIL || "vinodkumarjntua@gmail.com").toLowerCase().trim();
  const adminPassword = process.env.ADMIN_PASSWORD || "Vinod@2004";
  const adminName = process.env.ADMIN_NAME || "Vinod Kumar";
  let adminPhone = String(process.env.ADMIN_PHONE || "9959937373").trim();

  let adminUser = await User.findOne({ email: adminEmail }).select("+password");

  if (!adminUser) {
    const existingPhoneUser = await User.findOne({ phone: adminPhone });
    if (existingPhoneUser) {
      adminPhone = buildFallbackPhone();
    }

    adminUser = await User.create({
      username: adminName,
      email: adminEmail,
      phone: adminPhone,
      password: adminPassword,
      role: "admin",
      watchlist: ["RELIANCE.NS", "TCS.NS", "AAPL"]
    });

    console.log(`Admin account created for ${adminEmail}`);
    return;
  }

  let changed = false;

  if (adminUser.role !== "admin") {
    adminUser.role = "admin";
    changed = true;
    console.log(`Existing user promoted to admin: ${adminEmail}`);
  }

  const passwordMatches = await adminUser.comparePassword(adminPassword);
  if (!passwordMatches) {
    adminUser.password = adminPassword;
    changed = true;
    console.log(`Admin password synced for ${adminEmail}`);
  }

  if (changed) {
    await adminUser.save();
  }
};

module.exports = ensureAdmin;
