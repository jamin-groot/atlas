// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/**
 * @title AtlasReputationRegistry
 * @notice ERC-8004 compliant Reputation Registry.
 * Records client feedback about AI agent interactions — queryable, composable,
 * and permanently on-chain for radical transparency.
 */
contract AtlasReputationRegistry {

    address public immutable identityRegistry;

    struct Feedback {
        int128  value;
        uint8   valueDecimals;
        string  tag1;
        string  tag2;
        string  endpoint;
        string  feedbackURI;
        bytes32 feedbackHash;
        bool    isRevoked;
        uint256 timestamp;
    }

    struct Response {
        address responder;
        string  responseURI;
        bytes32 responseHash;
    }

    // agentId => client => feedbackIndex => Feedback
    mapping(uint256 => mapping(address => Feedback[])) private _feedback;
    // agentId => client => feedbackIndex => responses
    mapping(uint256 => mapping(address => mapping(uint64 => Response[]))) private _responses;
    // agentId => list of clients who gave feedback
    mapping(uint256 => address[]) private _clients;
    mapping(uint256 => mapping(address => bool)) private _hasClient;

    event NewFeedback(
        uint256 indexed agentId,
        address indexed clientAddress,
        uint64  feedbackIndex,
        int128  value,
        uint8   valueDecimals,
        string  indexed indexedTag1,
        string  tag1,
        string  tag2,
        string  endpoint,
        string  feedbackURI,
        bytes32 feedbackHash
    );

    event FeedbackRevoked(
        uint256 indexed agentId,
        address indexed clientAddress,
        uint64  indexed feedbackIndex
    );

    event ResponseAppended(
        uint256 indexed agentId,
        address indexed clientAddress,
        uint64  feedbackIndex,
        address indexed responder,
        string  responseURI,
        bytes32 responseHash
    );

    constructor(address _identityRegistry) {
        identityRegistry = _identityRegistry;
    }

    function getIdentityRegistry() external view returns (address) {
        return identityRegistry;
    }

    // ─── Feedback ─────────────────────────────────────────────────────────────

    function giveFeedback(
        uint256 agentId,
        int128  value,
        uint8   valueDecimals,
        string calldata tag1,
        string calldata tag2,
        string calldata endpoint,
        string calldata feedbackURI,
        bytes32 feedbackHash
    ) external {
        if (!_hasClient[agentId][msg.sender]) {
            _clients[agentId].push(msg.sender);
            _hasClient[agentId][msg.sender] = true;
        }

        uint64 feedbackIndex = uint64(_feedback[agentId][msg.sender].length);

        _feedback[agentId][msg.sender].push(Feedback({
            value:        value,
            valueDecimals: valueDecimals,
            tag1:         tag1,
            tag2:         tag2,
            endpoint:     endpoint,
            feedbackURI:  feedbackURI,
            feedbackHash: feedbackHash,
            isRevoked:    false,
            timestamp:    block.timestamp
        }));

        emit NewFeedback(agentId, msg.sender, feedbackIndex, value, valueDecimals, tag1, tag1, tag2, endpoint, feedbackURI, feedbackHash);
    }

    function revokeFeedback(uint256 agentId, uint64 feedbackIndex) external {
        require(feedbackIndex < _feedback[agentId][msg.sender].length, "No such feedback");
        _feedback[agentId][msg.sender][feedbackIndex].isRevoked = true;
        emit FeedbackRevoked(agentId, msg.sender, feedbackIndex);
    }

    function appendResponse(
        uint256 agentId,
        address clientAddress,
        uint64  feedbackIndex,
        string calldata responseURI,
        bytes32 responseHash
    ) external {
        require(feedbackIndex < _feedback[agentId][clientAddress].length, "No such feedback");
        _responses[agentId][clientAddress][feedbackIndex].push(Response({
            responder:   msg.sender,
            responseURI: responseURI,
            responseHash: responseHash
        }));
        emit ResponseAppended(agentId, clientAddress, feedbackIndex, msg.sender, responseURI, responseHash);
    }

    // ─── Queries ──────────────────────────────────────────────────────────────

    function getSummary(
        uint256 agentId,
        address[] calldata clientAddresses,
        string calldata tag1,
        string calldata tag2
    ) external view returns (uint64 count, int128 summaryValue, uint8 summaryValueDecimals) {
        bool filterClients = clientAddresses.length > 0;
        bool filterTag1    = bytes(tag1).length > 0;
        bool filterTag2    = bytes(tag2).length > 0;

        address[] storage allClients = _clients[agentId];
        uint256 n = filterClients ? clientAddresses.length : allClients.length;

        int256 sum;
        for (uint256 i = 0; i < n; i++) {
            address client = filterClients ? clientAddresses[i] : allClients[i];
            Feedback[] storage fb = _feedback[agentId][client];
            for (uint256 j = 0; j < fb.length; j++) {
                if (fb[j].isRevoked) continue;
                if (filterTag1 && keccak256(bytes(fb[j].tag1)) != keccak256(bytes(tag1))) continue;
                if (filterTag2 && keccak256(bytes(fb[j].tag2)) != keccak256(bytes(tag2))) continue;
                sum += fb[j].value;
                count++;
            }
        }
        summaryValue = count > 0 ? int128(sum / int256(uint256(count))) : int128(0);
        summaryValueDecimals = 2;
    }

    function readFeedback(
        uint256 agentId,
        address clientAddress,
        uint64  feedbackIndex
    ) external view returns (
        int128 value, uint8 valueDecimals, string memory tag1, string memory tag2, bool isRevoked
    ) {
        Feedback storage fb = _feedback[agentId][clientAddress][feedbackIndex];
        return (fb.value, fb.valueDecimals, fb.tag1, fb.tag2, fb.isRevoked);
    }

    function readAllFeedback(
        uint256 agentId,
        address[] calldata clientAddresses,
        string calldata tag1,
        string calldata tag2,
        bool includeRevoked
    ) external view returns (
        address[] memory clients,
        uint64[]  memory feedbackIndexes,
        int128[]  memory values,
        uint8[]   memory valueDecimals,
        string[]  memory tag1s,
        string[]  memory tag2s,
        bool[]    memory revokedStatuses
    ) {
        bool filterClients = clientAddresses.length > 0;
        bool filterTag1    = bytes(tag1).length > 0;
        bool filterTag2    = bytes(tag2).length > 0;

        address[] storage allClients = _clients[agentId];
        uint256 srcCount = filterClients ? clientAddresses.length : allClients.length;

        // Count matching entries
        uint256 total;
        for (uint256 i = 0; i < srcCount; i++) {
            address client = filterClients ? clientAddresses[i] : allClients[i];
            Feedback[] storage fb = _feedback[agentId][client];
            for (uint256 j = 0; j < fb.length; j++) {
                if (!includeRevoked && fb[j].isRevoked) continue;
                if (filterTag1 && keccak256(bytes(fb[j].tag1)) != keccak256(bytes(tag1))) continue;
                if (filterTag2 && keccak256(bytes(fb[j].tag2)) != keccak256(bytes(tag2))) continue;
                total++;
            }
        }

        clients        = new address[](total);
        feedbackIndexes = new uint64[](total);
        values         = new int128[](total);
        valueDecimals  = new uint8[](total);
        tag1s          = new string[](total);
        tag2s          = new string[](total);
        revokedStatuses = new bool[](total);

        uint256 idx;
        for (uint256 i = 0; i < srcCount; i++) {
            address client = filterClients ? clientAddresses[i] : allClients[i];
            Feedback[] storage fb = _feedback[agentId][client];
            for (uint256 j = 0; j < fb.length; j++) {
                if (!includeRevoked && fb[j].isRevoked) continue;
                if (filterTag1 && keccak256(bytes(fb[j].tag1)) != keccak256(bytes(tag1))) continue;
                if (filterTag2 && keccak256(bytes(fb[j].tag2)) != keccak256(bytes(tag2))) continue;
                clients[idx]         = client;
                feedbackIndexes[idx] = uint64(j);
                values[idx]          = fb[j].value;
                valueDecimals[idx]   = fb[j].valueDecimals;
                tag1s[idx]           = fb[j].tag1;
                tag2s[idx]           = fb[j].tag2;
                revokedStatuses[idx] = fb[j].isRevoked;
                idx++;
            }
        }
    }

    function getResponseCount(
        uint256 agentId,
        address clientAddress,
        uint64  feedbackIndex,
        address[] calldata
    ) external view returns (uint64) {
        return uint64(_responses[agentId][clientAddress][feedbackIndex].length);
    }

    function getClients(uint256 agentId) external view returns (address[] memory) {
        return _clients[agentId];
    }

    function getLastIndex(uint256 agentId, address clientAddress) external view returns (uint64) {
        uint256 len = _feedback[agentId][clientAddress].length;
        return len > 0 ? uint64(len - 1) : 0;
    }
}
