const SystemWallet = require("../model/system-wallet");

// Admin: Create a new system wallet address
exports.createSystemWallet = async (req, res) => {
  if (!req.user?.isAdmin) return res.status(401).json({ message: "Unauthorized" });

  const { label, currency, address, network } = req.body;

  try {
    const wallet = new SystemWallet({ label, currency, address, network });
    const saved = await wallet.save();
    res.status(200).json({ message: "Wallet added successfully!", wallet: saved });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message || "Error creating wallet" });
  }
};

// Public/User: Get all active system wallets (for payment page)
exports.getSystemWallet = async (req, res) => {
  try {
    const wallets = await SystemWallet.find({ isActive: true });
    res.status(200).json({ message: wallets });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error fetching wallets" });
  }
};

// Admin: Get ALL wallets (including inactive)
exports.getAllSystemWallets = async (req, res) => {
  if (!req.user?.isAdmin) return res.status(401).json({ message: "Unauthorized" });
  try {
    const wallets = await SystemWallet.find();
    res.status(200).json({ message: wallets });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error fetching wallets" });
  }
};

// Admin: Edit a system wallet
exports.editSystemWallet = async (req, res) => {
  if (!req.user?.isAdmin) return res.status(401).json({ message: "Unauthorized" });

  const { id } = req.params;
  const { label, currency, address, network, isActive } = req.body;

  try {
    const updated = await SystemWallet.findByIdAndUpdate(
      id,
      { label, currency, address, network, isActive },
      { new: true, runValidators: true }
    );

    if (!updated) return res.status(404).json({ message: "Wallet not found" });
    res.status(200).json({ message: "Wallet updated!", wallet: updated });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message || "Error updating wallet" });
  }
};

// Admin: Delete a system wallet
exports.deleteSystemWallet = async (req, res) => {
  if (!req.user?.isAdmin) return res.status(401).json({ message: "Unauthorized" });

  const { id } = req.params;
  try {
    const deleted = await SystemWallet.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "Wallet not found" });
    res.status(200).json({ message: "Wallet deleted successfully!" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error deleting wallet" });
  }
};
