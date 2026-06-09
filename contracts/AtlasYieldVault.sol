// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title AtlasYieldVault
 * @notice Testnet yield vault simulating mETH / USDY / mUSD on Mantle Sepolia.
 * Accepts MNT deposits, mints yield-bearing shares, accrues yield every block.
 *
 * This is a simplified ERC-4626-style vault for Atlas hackathon demo.
 */
contract AtlasYieldVault is ERC20, Ownable {
    // Vault metadata
    string public assetSymbol;      // "mETH" | "USDY" | "mUSD"
    string public protocol;         // "Mantle LSP" | "Ondo Finance" | "Mantle"
    uint256 public apyBps;          // APY in basis points (380 = 3.80%)

    // Exchange rate: how much MNT one share is worth (starts at 1e18, grows over time)
    uint256 public exchangeRate;
    uint256 public lastUpdateBlock;

    // Track all depositors
    address[] private _depositors;
    mapping(address => bool) private _isDepositor;

    // Total MNT deposited (before yield)
    uint256 public totalDeposited;

    event Deposited(address indexed user, uint256 mntAmount, uint256 sharesIssued);
    event Withdrawn(address indexed user, uint256 sharesRedeemed, uint256 mntReturned);
    event YieldAccrued(uint256 newExchangeRate);

    constructor(
        string memory name_,
        string memory symbol_,
        string memory assetSymbol_,
        string memory protocol_,
        uint256 apyBps_
    ) ERC20(name_, symbol_) Ownable(msg.sender) {
        assetSymbol = assetSymbol_;
        protocol = protocol_;
        apyBps = apyBps_;
        exchangeRate = 1e18;
        lastUpdateBlock = block.number;
    }

    // ─── Yield Accrual ───────────────────────────────────────────────────────

    /**
     * @dev Update exchange rate based on blocks elapsed.
     * Yield per block = APY / (365 * 24 * 3600 / 2) assuming ~2s blocks on Mantle.
     * We accelerate 10x on testnet so users can see yield accumulate quickly.
     */
    function _accrueYield() internal {
        uint256 blocks = block.number - lastUpdateBlock;
        if (blocks == 0) return;

        // Yield per block (10x accelerated for testnet visibility)
        // APY in bps / 10000 / blocksPerYear * 10 (testnet acceleration)
        uint256 blocksPerYear = 15_768_000; // ~2s blocks
        uint256 yieldPerBlock = (exchangeRate * apyBps * 10) / (10000 * blocksPerYear);

        exchangeRate += yieldPerBlock * blocks;
        lastUpdateBlock = block.number;

        emit YieldAccrued(exchangeRate);
    }

    // ─── Core Functions ───────────────────────────────────────────────────────

    /**
     * @notice Deposit MNT, receive yield-bearing shares
     */
    function deposit() external payable returns (uint256 shares) {
        require(msg.value > 0, "Must deposit > 0");
        _accrueYield();

        shares = (msg.value * 1e18) / exchangeRate;
        _mint(msg.sender, shares);
        totalDeposited += msg.value;

        if (!_isDepositor[msg.sender]) {
            _depositors.push(msg.sender);
            _isDepositor[msg.sender] = true;
        }

        emit Deposited(msg.sender, msg.value, shares);
    }

    /**
     * @notice Redeem shares for MNT + accrued yield
     */
    function withdraw(uint256 shares) external returns (uint256 mntAmount) {
        require(shares > 0 && balanceOf(msg.sender) >= shares, "Insufficient shares");
        _accrueYield();

        mntAmount = (shares * exchangeRate) / 1e18;
        require(address(this).balance >= mntAmount, "Insufficient vault liquidity");

        _burn(msg.sender, shares);
        payable(msg.sender).transfer(mntAmount);

        emit Withdrawn(msg.sender, shares, mntAmount);
    }

    function withdrawAll() external returns (uint256 mntAmount) {
        uint256 shares = balanceOf(msg.sender);
        require(shares > 0, "No position");
        _accrueYield();

        mntAmount = (shares * exchangeRate) / 1e18;
        require(address(this).balance >= mntAmount, "Insufficient vault liquidity");

        _burn(msg.sender, shares);
        payable(msg.sender).transfer(mntAmount);

        emit Withdrawn(msg.sender, shares, mntAmount);
    }

    // ─── View Functions ───────────────────────────────────────────────────────

    function getCurrentExchangeRate() external view returns (uint256) {
        uint256 blocks = block.number - lastUpdateBlock;
        uint256 blocksPerYear = 15_768_000;
        uint256 yieldPerBlock = (exchangeRate * apyBps * 10) / (10000 * blocksPerYear);
        return exchangeRate + yieldPerBlock * blocks;
    }

    function getPositionValue(address user) external view returns (
        uint256 shares,
        uint256 currentValue,
        uint256 depositedValue,
        uint256 yieldEarned
    ) {
        shares = balanceOf(user);
        uint256 blocks = block.number - lastUpdateBlock;
        uint256 blocksPerYear = 15_768_000;
        uint256 yieldPerBlock = (exchangeRate * apyBps * 10) / (10000 * blocksPerYear);
        uint256 currentRate = exchangeRate + yieldPerBlock * blocks;

        currentValue = (shares * currentRate) / 1e18;

        // Approximate deposited value (shares * initial rate ≈ deposit)
        depositedValue = (shares * 1e18) / currentRate * currentRate / 1e18;
        // Simpler: deposited ≈ currentValue at time of deposit
        // We store this in the event log; here approximate:
        depositedValue = shares > 0 ? (shares * 1e18) / currentRate : 0;
        depositedValue = currentValue > depositedValue ? depositedValue : currentValue;

        yieldEarned = currentValue > depositedValue ? currentValue - depositedValue : 0;
    }

    function getAPY() external view returns (uint256) {
        return apyBps;
    }

    function getTVL() external view returns (uint256) {
        return address(this).balance;
    }

    // Allow vault to receive MNT for liquidity seeding
    receive() external payable {}
}
