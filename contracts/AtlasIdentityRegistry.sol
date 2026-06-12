// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

/**
 * @title AtlasIdentityRegistry
 * @notice ERC-8004 compliant Identity Registry for Atlas Navigator AI agent.
 * Implements the full ERC-8004 Identity Registry interface including
 * signature-based wallet assignment.
 */
contract AtlasIdentityRegistry is ERC721, Ownable {
    using ECDSA for bytes32;

    struct MetadataEntry {
        string metadataKey;
        bytes metadataValue;
    }

    uint256 private _nextAgentId = 1;

    mapping(uint256 => string)  private _agentURIs;
    mapping(uint256 => mapping(string => bytes)) private _metadata;
    mapping(uint256 => address) private _agentWallets;
    mapping(address => uint256) private _usedNonces; // for replay protection

    // Atlas-specific: decision recording (kept for transparency layer)
    struct Decision {
        uint256 agentId;
        string  decisionType;
        string  payload;
        bytes32 payloadHash;
        uint256 timestamp;
        address recorder;
    }
    mapping(uint256 => Decision[]) private _decisions;
    uint256 public totalDecisions;

    event Registered(uint256 indexed agentId, string agentURI, address indexed owner);
    event URIUpdated(uint256 indexed agentId, string newURI, address indexed updatedBy);
    event MetadataSet(uint256 indexed agentId, string indexed indexedMetadataKey, string metadataKey, bytes metadataValue);
    event DecisionRecorded(uint256 indexed agentId, string decisionType, bytes32 payloadHash, uint256 indexed decisionIndex);

    constructor() ERC721("Atlas Agent Identity", "ATLAS-AGENT") Ownable(msg.sender) {}

    // ─── ERC-8004 Registration ────────────────────────────────────────────────

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

    // ─── ERC-8004 URI & Metadata ──────────────────────────────────────────────

    function setAgentURI(uint256 agentId, string calldata newURI) external {
        require(ownerOf(agentId) == msg.sender, "Not agent owner");
        _agentURIs[agentId] = newURI;
        emit URIUpdated(agentId, newURI, msg.sender);
    }

    function tokenURI(uint256 agentId) public view override returns (string memory) {
        ownerOf(agentId);
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

    // ─── ERC-8004 Agent Wallet (signature-based) ─────────────────────────────

    /**
     * @notice ERC-8004 compliant setAgentWallet with deadline + signature.
     * The new wallet must sign: keccak256(agentId, newWallet, deadline)
     */
    function setAgentWallet(
        uint256 agentId,
        address newWallet,
        uint256 deadline,
        bytes calldata signature
    ) external {
        require(ownerOf(agentId) == msg.sender, "Not agent owner");
        require(block.timestamp <= deadline, "Signature expired");

        bytes32 hash = MessageHashUtils.toEthSignedMessageHash(
            keccak256(abi.encodePacked(agentId, newWallet, deadline))
        );
        address recovered = ECDSA.recover(hash, signature);
        require(recovered == newWallet, "Invalid wallet signature");

        _agentWallets[agentId] = newWallet;
    }

    function getAgentWallet(uint256 agentId) external view returns (address) {
        return _agentWallets[agentId];
    }

    function unsetAgentWallet(uint256 agentId) external {
        require(ownerOf(agentId) == msg.sender, "Not agent owner");
        _agentWallets[agentId] = address(0);
    }

    // ─── Atlas Decision Recording ─────────────────────────────────────────────

    function recordDecision(
        uint256 agentId,
        string calldata decisionType,
        string calldata payload
    ) external returns (uint256 decisionIndex) {
        require(
            ownerOf(agentId) == msg.sender || _agentWallets[agentId] == msg.sender,
            "Not authorized"
        );
        bytes32 payloadHash = keccak256(abi.encodePacked(payload));
        decisionIndex = _decisions[agentId].length;
        _decisions[agentId].push(Decision({
            agentId:      agentId,
            decisionType: decisionType,
            payload:      payload,
            payloadHash:  payloadHash,
            timestamp:    block.timestamp,
            recorder:     msg.sender
        }));
        totalDecisions++;
        emit DecisionRecorded(agentId, decisionType, payloadHash, decisionIndex);
    }

    function getDecision(uint256 agentId, uint256 index) external view returns (Decision memory) {
        return _decisions[agentId][index];
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
