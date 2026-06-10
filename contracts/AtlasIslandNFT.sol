// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title AtlasIslandNFT
 * @notice Tokenized Atlas islands — each NFT represents a user's wealth island.
 * Islands can be minted once they reach a minimum TVL threshold.
 * Token metadata stores the island's tier, TVL snapshot, milestones, and health
 * score at time of minting — creating an on-chain record of portfolio performance.
 *
 * Future: fractional ownership + yield sharing can be layered on top.
 */
contract AtlasIslandNFT is ERC721, Ownable {

    uint256 public constant MIN_TVL_USD_CENTS = 500_000; // $5,000 minimum (in cents)

    struct IslandData {
        address owner;
        uint256 tvlUsdCents;      // TVL at mint time (USD × 100)
        uint8   tier;             // 0–5
        string  tierName;         // "Seedling" … "Metropolis"
        uint8   milestonesCount;  // buildings unlocked at mint
        uint8   healthScore;      // 0–100
        uint256 mintedAt;
        bool    forSale;          // owner can list for investment
        uint256 priceUsdCents;    // listing price in USD cents
    }

    uint256 private _nextTokenId = 1;

    mapping(uint256 => IslandData) public islands;
    mapping(address => uint256)    public userIslandToken; // one island per wallet
    mapping(address => bool)       public hasMinted;

    event IslandMinted(
        address indexed owner,
        uint256 indexed tokenId,
        uint8   tier,
        string  tierName,
        uint256 tvlUsdCents,
        uint8   milestonesCount
    );

    event IslandListed(uint256 indexed tokenId, uint256 priceUsdCents);
    event IslandDelisted(uint256 indexed tokenId);

    constructor() ERC721("Atlas Island", "ATLAS-ISL") Ownable(msg.sender) {}

    /**
     * @notice Mint your Atlas island as an NFT.
     * @param tvlUsdCents    Portfolio TVL in USD × 100 (verified off-chain, stored as snapshot)
     * @param tier           Island tier 0–5
     * @param tierName       Human-readable tier name
     * @param milestonesCount Number of milestone buildings unlocked
     * @param healthScore    Portfolio health score 0–100
     */
    function mintIsland(
        uint256 tvlUsdCents,
        uint8   tier,
        string  calldata tierName,
        uint8   milestonesCount,
        uint8   healthScore
    ) external returns (uint256 tokenId) {
        require(!hasMinted[msg.sender], "Island already minted");
        require(tvlUsdCents >= MIN_TVL_USD_CENTS, "TVL below minimum ($5,000)");
        require(tier >= 2, "Must reach Outpost tier or higher");

        tokenId = _nextTokenId++;
        _mint(msg.sender, tokenId);

        islands[tokenId] = IslandData({
            owner:           msg.sender,
            tvlUsdCents:     tvlUsdCents,
            tier:            tier,
            tierName:        tierName,
            milestonesCount: milestonesCount,
            healthScore:     healthScore,
            mintedAt:        block.timestamp,
            forSale:         false,
            priceUsdCents:   0
        });

        userIslandToken[msg.sender] = tokenId;
        hasMinted[msg.sender]       = true;

        emit IslandMinted(msg.sender, tokenId, tier, tierName, tvlUsdCents, milestonesCount);
    }

    /**
     * @notice List your island for investment discovery.
     */
    function listIsland(uint256 tokenId, uint256 priceUsdCents) external {
        require(ownerOf(tokenId) == msg.sender, "Not your island");
        islands[tokenId].forSale      = true;
        islands[tokenId].priceUsdCents = priceUsdCents;
        emit IslandListed(tokenId, priceUsdCents);
    }

    /**
     * @notice Remove island from investment listing.
     */
    function delistIsland(uint256 tokenId) external {
        require(ownerOf(tokenId) == msg.sender, "Not your island");
        islands[tokenId].forSale = false;
        emit IslandDelisted(tokenId);
    }

    /**
     * @notice Get all listed islands for the marketplace.
     */
    function getListedIslands() external view returns (uint256[] memory tokenIds) {
        uint256 total = _nextTokenId - 1;
        uint256 count;
        for (uint256 i = 1; i <= total; i++) count += islands[i].forSale ? 1 : 0;
        tokenIds = new uint256[](count);
        uint256 idx;
        for (uint256 i = 1; i <= total; i++) {
            if (islands[i].forSale) tokenIds[idx++] = i;
        }
    }

    function totalMinted() external view returns (uint256) {
        return _nextTokenId - 1;
    }
}
