// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/**
 * @title AtlasValidationRegistry
 * @notice ERC-8004 compliant Validation Registry.
 * Provides independent, on-chain verification of AI agent actions —
 * answering "did the agent actually do what it claims?"
 */
contract AtlasValidationRegistry {

    address public immutable identityRegistry;

    // response codes: 0 = pending, 1 = validated, 2 = rejected, 3 = inconclusive
    struct ValidationEntry {
        address validatorAddress;
        uint256 agentId;
        string  requestURI;
        bytes32 requestHash;
        uint8   response;       // 0 pending | 1 validated | 2 rejected | 3 inconclusive
        string  responseURI;
        bytes32 responseHash;
        string  tag;
        uint256 lastUpdate;
    }

    mapping(bytes32 => ValidationEntry) private _validations;
    mapping(uint256 => bytes32[]) private _agentValidations;
    mapping(address => bytes32[]) private _validatorRequests;

    event ValidationRequest(
        address indexed validatorAddress,
        uint256 indexed agentId,
        string  requestURI,
        bytes32 indexed requestHash
    );

    event ValidationResponse(
        address indexed validatorAddress,
        uint256 indexed agentId,
        bytes32 indexed requestHash,
        uint8   response,
        string  responseURI,
        bytes32 responseHash,
        string  tag
    );

    constructor(address _identityRegistry) {
        identityRegistry = _identityRegistry;
    }

    function getIdentityRegistry() external view returns (address) {
        return identityRegistry;
    }

    // ─── Request & Response ───────────────────────────────────────────────────

    function validationRequest(
        address validatorAddress,
        uint256 agentId,
        string calldata requestURI,
        bytes32 requestHash
    ) external {
        require(_validations[requestHash].requestHash == bytes32(0), "Request already exists");

        _validations[requestHash] = ValidationEntry({
            validatorAddress: validatorAddress,
            agentId:          agentId,
            requestURI:       requestURI,
            requestHash:      requestHash,
            response:         0,
            responseURI:      "",
            responseHash:     bytes32(0),
            tag:              "",
            lastUpdate:       block.timestamp
        });

        _agentValidations[agentId].push(requestHash);
        _validatorRequests[validatorAddress].push(requestHash);

        emit ValidationRequest(validatorAddress, agentId, requestURI, requestHash);
    }

    function validationResponse(
        bytes32 requestHash,
        uint8   response,
        string calldata responseURI,
        bytes32 responseHash,
        string calldata tag
    ) external {
        ValidationEntry storage entry = _validations[requestHash];
        require(entry.requestHash != bytes32(0), "Request not found");
        require(entry.validatorAddress == msg.sender, "Not the designated validator");
        require(response >= 1 && response <= 3, "Invalid response code");

        entry.response     = response;
        entry.responseURI  = responseURI;
        entry.responseHash = responseHash;
        entry.tag          = tag;
        entry.lastUpdate   = block.timestamp;

        emit ValidationResponse(entry.validatorAddress, entry.agentId, requestHash, response, responseURI, responseHash, tag);
    }

    // ─── Queries ──────────────────────────────────────────────────────────────

    function getValidationStatus(bytes32 requestHash)
        external view returns (
            address validatorAddress,
            uint256 agentId,
            uint8   response,
            bytes32 responseHash,
            string memory tag,
            uint256 lastUpdate
        )
    {
        ValidationEntry storage e = _validations[requestHash];
        return (e.validatorAddress, e.agentId, e.response, e.responseHash, e.tag, e.lastUpdate);
    }

    function getSummary(
        uint256 agentId,
        address[] calldata validatorAddresses,
        string calldata tag
    ) external view returns (uint64 count, uint8 averageResponse) {
        bool filterValidators = validatorAddresses.length > 0;
        bool filterTag        = bytes(tag).length > 0;

        bytes32[] storage hashes = _agentValidations[agentId];
        uint256 sum;

        for (uint256 i = 0; i < hashes.length; i++) {
            ValidationEntry storage e = _validations[hashes[i]];
            if (e.response == 0) continue; // pending
            if (filterTag && keccak256(bytes(e.tag)) != keccak256(bytes(tag))) continue;
            if (filterValidators) {
                bool found;
                for (uint256 j = 0; j < validatorAddresses.length; j++) {
                    if (validatorAddresses[j] == e.validatorAddress) { found = true; break; }
                }
                if (!found) continue;
            }
            sum += e.response;
            count++;
        }

        averageResponse = count > 0 ? uint8(sum / count) : 0;
    }

    function getAgentValidations(uint256 agentId) external view returns (bytes32[] memory) {
        return _agentValidations[agentId];
    }

    function getValidatorRequests(address validatorAddress) external view returns (bytes32[] memory) {
        return _validatorRequests[validatorAddress];
    }
}
