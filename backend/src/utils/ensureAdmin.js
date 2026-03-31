const User = require("../models/User");

const buildFallbackPhone = () => {
  const stamp = String(Date.now()).slice(-9);
  return `9${stamp}`;
};

const ensureAdmin = async () => {
  const adminEmail = (process.env.ADMIN_EMAIL || "vinodkumarjntua@gmail.com").toLowerCase().trim();
  const adminPassword = process.env.ADMIN_PASSWORD || "Vinodkumar";
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

  const demoEmail = (process.env.DEMO_USER_EMAIL || "user@gmail.com").toLowerCase().trim();
  const demoPassword = process.env.DEMO_USER_PASSWORD || "user123";
  const demoName = process.env.DEMO_USER_NAME || "Demo User";
  let demoPhone = String(process.env.DEMO_USER_PHONE || "9000000001").trim();

  let demoUser = await User.findOne({ email: demoEmail }).select("+password");

  if (!demoUser) {
    const existingPhoneUser = await User.findOne({ phone: demoPhone });
    if (existingPhoneUser) {
      demoPhone = buildFallbackPhone();
    }

    await User.create({
      username: demoName,
      email: demoEmail,
      phone: demoPhone,
      password: demoPassword,
      role: "user",
      watchlist: ["RELIANCE.NS", "TCS.NS", "INFY.NS"]
    });

    console.log(`Demo user account created for ${demoEmail}`);
    return;
  }

  let demoChanged = false;

  if (demoUser.role !== "user") {
    demoUser.role = "user";
    demoChanged = true;
  }

  if (demoUser.username !== demoName) {
    demoUser.username = demoName;
    demoChanged = true;
  }

  const demoPasswordMatches = await demoUser.comparePassword(demoPassword);
  if (!demoPasswordMatches) {
    demoUser.password = demoPassword;
    demoChanged = true;
    console.log(`Demo user password synced for ${demoEmail}`);
  }

  if (demoChanged) {
    await demoUser.save();
  }
};

module.exports = ensureAdmin;
