// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title AtlasAchievements
 * @notice Soulbound achievement NFTs for Atlas users on Mantle.
 * Minted when users hit wealth milestones — first allocation,
 * $100/month income, health score 90+, and more.
 */
contract AtlasAchievements is ERC721, Ownable {

    struct Achievement {
        string id;        // "first_allocation" | "income_100" | "health_90" | "explorer"
        string name;
        string symbol;    // emoji-like short symbol
        address recipient;
        uint256 timestamp;
    }

    uint256 private _nextTokenId = 1;
    mapping(uint256 => Achievement) public achievements;
    mapping(address => mapping(string => bool)) public hasAchievement;
    mapping(address => uint256[]) public userAchievements;

    event AchievementMinted(
        address indexed recipient,
        uint256 indexed tokenId,
        string achievementId,
        string name
    );

    constructor() ERC721("Atlas Achievements", "ATLAS-ACH") Ownable(msg.sender) {}

    function mint(
        address recipient,
        string calldata achievementId,
        string calldata name,
        string calldata symbol
    ) external onlyOwner returns (uint256 tokenId) {
        require(!hasAchievement[recipient][achievementId], "Already earned");

        tokenId = _nextTokenId++;
        _mint(recipient, tokenId);

        achievements[tokenId] = Achievement({
            id: achievementId,
            name: name,
            symbol: symbol,
            recipient: recipient,
            timestamp: block.timestamp
        });

        hasAchievement[recipient][achievementId] = true;
        userAchievements[recipient].push(tokenId);

        emit AchievementMinted(recipient, tokenId, achievementId, name);
    }

    function getUserAchievements(address user) external view returns (Achievement[] memory) {
        uint256[] memory ids = userAchievements[user];
        Achievement[] memory result = new Achievement[](ids.length);
        for (uint256 i = 0; i < ids.length; i++) {
            result[i] = achievements[ids[i]];
        }
        return result;
    }

    // Soulbound — non-transferable
    function transferFrom(address, address, uint256) public pure override {
        revert("Soulbound: non-transferable");
    }
}
