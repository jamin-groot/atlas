// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title AtlasIdentityRegistry
 * @notice ERC-8004 Identity Registry for Atlas Navigator agent
 * Atlas Navigator is an AI agent that guides wealth exploration on Mantle.
 * Every decision it makes is recorded on-chain for radical transparency.
 */
contract AtlasIdentityRegistry is ERC721, Ownable {
    struct MetadataEntry {
        string metadataKey;
        bytes metadataValue;
    }

    uint256 private _nextAgentId = 1;

    // agentId => URI
    mapping(uint256 => string) private _agentURIs;
    // agentId => key => value
    mapping(uint256 => mapping(string => bytes)) private _metadata;
    // agentId => agent wallet
    mapping(uint256 => address) private _agentWallets;

    // Decision recording
    struct Decision {
        uint256 agentId;
        string decisionType;   // "route_suggestion" | "opportunity_recommendation" | "portfolio_analysis"
        string payload;        // JSON summary of the decision
        bytes32 payloadHash;
        uint256 timestamp;
        address recorder;
    }

    mapping(uint256 => Decision[]) private _decisions;
    uint256 public totalDecisions;

    event Registered(uint256 indexed agentId, string agentURI, address indexed owner);
    event MetadataSet(uint256 indexed agentId, string indexed indexedMetadataKey, string metadataKey, bytes metadataValue);
    event URIUpdated(uint256 indexed agentId, string newURI, address indexed updatedBy);
    event DecisionRecorded(uint256 indexed agentId, string decisionType, bytes32 payloadHash, uint256 indexed decisionIndex);

    constructor() ERC721("Atlas Agent Identity", "ATLAS-AGENT") Ownable(msg.sender) {}

    // ─── Registration ───────────────────────────────────────────────────────

    function register(string calldata agentURI, MetadataEntry[] calldata metadata)
        external returns (uint256 agentId)
    {
        agentId = _nextAgentId++;
        _mint(msg.sender, agentId);
        _agentURIs[agentId] = agentURI;

        for (uint256 i = 0; i < metadata.length; i++) {
            _metadata[agentId][metadata[i].metadataKey] = metadata[i].metadataValue;
            emit MetadataSet(agentId, metadata[i].metadataKey, metadata[i].metadataKey, metadata[i].metadataValue);
        }

        emit Registered(agentId, agentURI, msg.sender);
    }

    function register(string calldata agentURI) external returns (uint256 agentId) {
        agentId = _nextAgentId++;
        _mint(msg.sender, agentId);
        _agentURIs[agentId] = agentURI;
        emit Registered(agentId, agentURI, msg.sender);
    }

    function register() external returns (uint256 agentId) {
        agentId = _nextAgentId++;
        _mint(msg.sender, agentId);
        emit Registered(agentId, "", msg.sender);
    }

    // ─── URI & Metadata ─────────────────────────────────────────────────────

    function setAgentURI(uint256 agentId, string calldata newURI) external {
        require(ownerOf(agentId) == msg.sender, "Not agent owner");
        _agentURIs[agentId] = newURI;
        emit URIUpdated(agentId, newURI, msg.sender);
    }

    function tokenURI(uint256 agentId) public view override returns (string memory) {
        ownerOf(agentId); // reverts if nonexistent
        return _agentURIs[agentId];
    }

    function getMetadata(uint256 agentId, string memory metadataKey)
        external view returns (bytes memory)
    {
        return _metadata[agentId][metadataKey];
    }

    function setMetadata(uint256 agentId, string memory metadataKey, bytes memory metadataValue)
        external
    {
        require(ownerOf(agentId) == msg.sender, "Not agent owner");
        _metadata[agentId][metadataKey] = metadataValue;
        emit MetadataSet(agentId, metadataKey, metadataKey, metadataValue);
    }

    // ─── Agent Wallet ────────────────────────────────────────────────────────

    function setAgentWallet(uint256 agentId, address newWallet) external {
        require(ownerOf(agentId) == msg.sender, "Not agent owner");
        _agentWallets[agentId] = newWallet;
    }

    function getAgentWallet(uint256 agentId) external view returns (address) {
        return _agentWallets[agentId];
    }

    function unsetAgentWallet(uint256 agentId) external {
        require(ownerOf(agentId) == msg.sender, "Not agent owner");
        _agentWallets[agentId] = address(0);
    }

    // ─── Decision Recording (Atlas-specific) ─────────────────────────────────

    /**
     * @notice Record an Atlas Navigator decision on-chain
     * Every route suggestion, opportunity recommendation, and portfolio analysis
     * is permanently recorded for radical transparency (Criterion 1 & 3).
     */
    function recordDecision(
        uint256 agentId,
        string calldata decisionType,
        string calldata payload
    ) external returns (uint256 decisionIndex) {
        require(ownerOf(agentId) == msg.sender || _agentWallets[agentId] == msg.sender, "Not authorized");

        bytes32 payloadHash = keccak256(abi.encodePacked(payload));
        decisionIndex = _decisions[agentId].length;

        _decisions[agentId].push(Decision({
            agentId: agentId,
            decisionType: decisionType,
            payload: payload,
            payloadHash: payloadHash,
            timestamp: block.timestamp,
            recorder: msg.sender
        }));

        totalDecisions++;
        emit DecisionRecorded(agentId, decisionType, payloadHash, decisionIndex);
    }

    function getDecision(uint256 agentId, uint256 decisionIndex)
        external view returns (Decision memory)
    {
        return _decisions[agentId][decisionIndex];
    }

    function getDecisionCount(uint256 agentId) external view returns (uint256) {
        return _decisions[agentId].length;
    }

    function getRecentDecisions(uint256 agentId, uint256 count)
        external view returns (Decision[] memory)
    {
        uint256 total = _decisions[agentId].length;
        uint256 n = count > total ? total : count;
        Decision[] memory result = new Decision[](n);
        for (uint256 i = 0; i < n; i++) {
            result[i] = _decisions[agentId][total - n + i];
        }
        return result;
    }
}
