// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface ICode {
    function balanceOf(address account) external view returns (uint256);
    function totalSupply() external view returns (uint256);
}

/**
 * @title CreodeGovernance
 * @notice On-chain, CODE-weighted governance for the Creode protocol. Anyone
 *         holding at least {proposalThreshold} CODE can open a proposal; any
 *         CODE holder can cast a single Yes/No vote weighted by their live CODE
 *         balance. After the voting window closes a proposal can be finalized:
 *         it Passes if it clears {quorumVotes} total votes AND has more For than
 *         Against, otherwise it is Rejected.
 *
 *         Proposals are signalling decisions (yield emissions, new vault assets,
 *         parameter and upgrade direction). The tally lives entirely on-chain
 *         and is tamper-proof; the protocol's role-gated admin then enacts the
 *         passed direction. Voting weight is read live from {ICode-balanceOf} —
 *         a deliberate testnet simplification kept clear in the docs.
 */
contract CreodeGovernance is Ownable, ReentrancyGuard {
    ICode public immutable code;

    /// @notice CODE needed to open a proposal.
    uint256 public proposalThreshold = 1_000 ether;
    /// @notice How long voting stays open once a proposal is created.
    uint256 public votingPeriod = 3 days;
    /// @notice Minimum total votes (For + Against) for a proposal to be valid.
    uint256 public quorumVotes = 50_000 ether;

    enum State { Active, Passed, Rejected }

    struct Proposal {
        uint256 id;
        address proposer;
        string title;
        string description;
        uint256 start;
        uint256 deadline;
        uint256 forVotes;
        uint256 againstVotes;
        bool finalized;
        bool passed;
    }

    Proposal[] private _proposals;
    /// @notice proposalId => voter => voted already?
    mapping(uint256 => mapping(address => bool)) public hasVoted;

    event ProposalCreated(uint256 indexed id, address indexed proposer, string title, uint256 deadline);
    event VoteCast(uint256 indexed id, address indexed voter, bool support, uint256 weight);
    event ProposalFinalized(uint256 indexed id, bool passed, uint256 forVotes, uint256 againstVotes);

    constructor(address codeToken) Ownable(msg.sender) {
        require(codeToken != address(0), "Gov: zero token");
        code = ICode(codeToken);
    }

    // ── Write ─────────────────────────────────────────────────────────────

    /// @notice Open a new proposal. Requires >= {proposalThreshold} CODE.
    function propose(string calldata title, string calldata description) external nonReentrant returns (uint256 id) {
        require(bytes(title).length > 0, "Gov: empty title");
        require(bytes(title).length <= 120, "Gov: title too long");
        require(bytes(description).length <= 4000, "Gov: description too long");
        require(code.balanceOf(msg.sender) >= proposalThreshold, "Gov: below proposal threshold");

        id = _proposals.length;
        _proposals.push(Proposal({
            id: id,
            proposer: msg.sender,
            title: title,
            description: description,
            start: block.timestamp,
            deadline: block.timestamp + votingPeriod,
            forVotes: 0,
            againstVotes: 0,
            finalized: false,
            passed: false
        }));
        emit ProposalCreated(id, msg.sender, title, block.timestamp + votingPeriod);
    }

    /// @notice Cast a single weighted vote on a proposal. Weight = live CODE balance.
    function castVote(uint256 id, bool support) external nonReentrant {
        require(id < _proposals.length, "Gov: bad id");
        Proposal storage p = _proposals[id];
        require(block.timestamp <= p.deadline, "Gov: voting closed");
        require(!hasVoted[id][msg.sender], "Gov: already voted");

        uint256 weight = code.balanceOf(msg.sender);
        require(weight > 0, "Gov: no voting power");

        hasVoted[id][msg.sender] = true;
        if (support) p.forVotes += weight; else p.againstVotes += weight;
        emit VoteCast(id, msg.sender, support, weight);
    }

    /// @notice Close voting and record the outcome. Callable by anyone after the deadline.
    function finalize(uint256 id) external nonReentrant {
        require(id < _proposals.length, "Gov: bad id");
        Proposal storage p = _proposals[id];
        require(block.timestamp > p.deadline, "Gov: voting still open");
        require(!p.finalized, "Gov: already finalized");

        uint256 total = p.forVotes + p.againstVotes;
        bool passed = total >= quorumVotes && p.forVotes > p.againstVotes;
        p.finalized = true;
        p.passed = passed;
        emit ProposalFinalized(id, passed, p.forVotes, p.againstVotes);
    }

    // ── Views ─────────────────────────────────────────────────────────────

    function proposalCount() external view returns (uint256) {
        return _proposals.length;
    }

    function getProposal(uint256 id) external view returns (Proposal memory) {
        require(id < _proposals.length, "Gov: bad id");
        return _proposals[id];
    }

    /// @notice Page through proposals, newest-first is left to the caller.
    function getProposals(uint256 offset, uint256 limit) external view returns (Proposal[] memory list) {
        uint256 n = _proposals.length;
        if (offset >= n || limit == 0) return new Proposal[](0);
        uint256 end = offset + limit;
        if (end > n) end = n;
        list = new Proposal[](end - offset);
        for (uint256 i = offset; i < end; i++) list[i - offset] = _proposals[i];
    }

    function stateOf(uint256 id) external view returns (State) {
        require(id < _proposals.length, "Gov: bad id");
        Proposal storage p = _proposals[id];
        if (!p.finalized) return State.Active;
        return p.passed ? State.Passed : State.Rejected;
    }

    /// @notice Live CODE balance = voting power of `account`.
    function votingPower(address account) external view returns (uint256) {
        return code.balanceOf(account);
    }

    // ── Admin ─────────────────────────────────────────────────────────────

    function setProposalThreshold(uint256 amount) external onlyOwner { proposalThreshold = amount; }
    function setVotingPeriod(uint256 seconds_) external onlyOwner {
        require(seconds_ >= 1, "Gov: too short");
        votingPeriod = seconds_;
    }
    function setQuorumVotes(uint256 amount) external onlyOwner { quorumVotes = amount; }
}
