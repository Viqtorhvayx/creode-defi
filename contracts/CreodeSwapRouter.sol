// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title CreodeSwapRouter
 * @author Viqtorhvayx
 * @notice Minimal constant-product AMM (x*y=k) providing real on-chain swaps
 *         between the Creode ecosystem tokens on Hedera. This is the swap
 *         venue the Earn / Yield Hub zaps route through — genuine on-chain
 *         swaps (real transfers, real price impact), branded "SaucerSwap V2"
 *         in the UI. Supports native HBAR (token == address(0), amounts in
 *         tinybar inside the EVM) and HTS/ERC20 tokens uniformly.
 *
 * Pools are stored in canonical token order (token0 < token1). A 0.30% fee
 * is retained in the reserves on every swap.
 */
contract CreodeSwapRouter is AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;

    address public constant HBAR = address(0);
    uint256 public constant FEE_BPS = 30; // 0.30%
    uint256 public constant BPS = 10_000;

    struct Pool {
        uint256 reserve0;
        uint256 reserve1;
        bool exists;
    }

    /// @notice poolKey => reserves (token0 < token1).
    mapping(bytes32 => Pool) private _pools;

    event PoolCreated(address indexed token0, address indexed token1);
    event LiquidityAdded(address indexed token0, address indexed token1, uint256 amount0, uint256 amount1);
    event Swap(address indexed tokenIn, address indexed tokenOut, uint256 amountIn, uint256 amountOut, address indexed to);

    constructor(address admin) {
        require(admin != address(0), "Admin is zero address");
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
    }

    // ─────────────────────────────────────────────────────────────────────
    // Pool keys / ordering
    // ─────────────────────────────────────────────────────────────────────

    function _order(address a, address b) private pure returns (address t0, address t1) {
        return a < b ? (a, b) : (b, a);
    }

    function _key(address a, address b) private pure returns (bytes32) {
        (address t0, address t1) = _order(a, b);
        return keccak256(abi.encodePacked(t0, t1));
    }

    // ─────────────────────────────────────────────────────────────────────
    // Custody helpers (native HBAR + ERC20)
    // ─────────────────────────────────────────────────────────────────────

    /// @dev Pull `amount` of `token` from the caller. For HBAR the amount must
    ///      arrive as msg.value; `hbarUsed` tracks how much msg.value is consumed.
    function _pull(address token, uint256 amount, uint256 msgValue, uint256 hbarUsed) private returns (uint256) {
        if (token == HBAR) {
            require(msgValue - hbarUsed >= amount, "Insufficient HBAR");
            return hbarUsed + amount;
        }
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        return hbarUsed;
    }

    function _push(address token, address to, uint256 amount) private {
        if (amount == 0) return;
        if (token == HBAR) {
            (bool ok, ) = payable(to).call{ value: amount }("");
            require(ok, "HBAR transfer failed");
        } else {
            IERC20(token).safeTransfer(to, amount);
        }
    }

    // ─────────────────────────────────────────────────────────────────────
    // Liquidity (admin-seeded)
    // ─────────────────────────────────────────────────────────────────────

    /**
     * @notice Seed or top up a pool. Amounts are pulled from the caller; if one
     *         side is HBAR it must be sent as msg.value.
     */
    function addLiquidity(address tokenA, uint256 amountA, address tokenB, uint256 amountB)
        external
        payable
        nonReentrant
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        require(tokenA != tokenB, "Identical tokens");
        require(amountA > 0 && amountB > 0, "Zero amount");

        uint256 used = _pull(tokenA, amountA, msg.value, 0);
        used = _pull(tokenB, amountB, msg.value, used);

        bytes32 k = _key(tokenA, tokenB);
        Pool storage p = _pools[k];
        (address t0, ) = _order(tokenA, tokenB);
        (uint256 add0, uint256 add1) = tokenA == t0 ? (amountA, amountB) : (amountB, amountA);

        if (!p.exists) {
            p.exists = true;
            (address o0, address o1) = _order(tokenA, tokenB);
            emit PoolCreated(o0, o1);
        }
        p.reserve0 += add0;
        p.reserve1 += add1;

        (address e0, address e1) = _order(tokenA, tokenB);
        emit LiquidityAdded(e0, e1, add0, add1);
    }

    // ─────────────────────────────────────────────────────────────────────
    // Quotes
    // ─────────────────────────────────────────────────────────────────────

    function getReserves(address tokenIn, address tokenOut) public view returns (uint256 reserveIn, uint256 reserveOut) {
        bytes32 k = _key(tokenIn, tokenOut);
        Pool memory p = _pools[k];
        (address t0, ) = _order(tokenIn, tokenOut);
        if (tokenIn == t0) return (p.reserve0, p.reserve1);
        return (p.reserve1, p.reserve0);
    }

    function poolExists(address tokenA, address tokenB) external view returns (bool) {
        return _pools[_key(tokenA, tokenB)].exists;
    }

    /// @notice Constant-product output for `amountIn`, net of the swap fee.
    function getAmountOut(address tokenIn, address tokenOut, uint256 amountIn) public view returns (uint256) {
        require(amountIn > 0, "Zero input");
        (uint256 reserveIn, uint256 reserveOut) = getReserves(tokenIn, tokenOut);
        require(reserveIn > 0 && reserveOut > 0, "No liquidity");
        uint256 amountInWithFee = (amountIn * (BPS - FEE_BPS)) / BPS;
        return (reserveOut * amountInWithFee) / (reserveIn + amountInWithFee);
    }

    // ─────────────────────────────────────────────────────────────────────
    // Swap
    // ─────────────────────────────────────────────────────────────────────

    /**
     * @notice Swap `amountIn` of `tokenIn` for `tokenOut`, sending the output to
     *         `to`. For HBAR input, send it as msg.value.
     */
    function swap(address tokenIn, address tokenOut, uint256 amountIn, uint256 minOut, address to)
        external
        payable
        nonReentrant
        returns (uint256 amountOut)
    {
        require(tokenIn != tokenOut, "Identical tokens");
        require(to != address(0), "Zero recipient");

        amountOut = getAmountOut(tokenIn, tokenOut, amountIn);
        require(amountOut >= minOut, "Slippage");

        // Take the input.
        if (tokenIn == HBAR) {
            require(msg.value >= amountIn, "Insufficient HBAR");
        } else {
            require(msg.value == 0, "No HBAR for token swap");
            IERC20(tokenIn).safeTransferFrom(msg.sender, address(this), amountIn);
        }

        // Update reserves (canonical order).
        bytes32 k = _key(tokenIn, tokenOut);
        Pool storage p = _pools[k];
        (address t0, ) = _order(tokenIn, tokenOut);
        if (tokenIn == t0) {
            p.reserve0 += amountIn;
            p.reserve1 -= amountOut;
        } else {
            p.reserve1 += amountIn;
            p.reserve0 -= amountOut;
        }

        _push(tokenOut, to, amountOut);
        emit Swap(tokenIn, tokenOut, amountIn, amountOut, to);
    }

    /// @notice Accept plain HBAR (needed so pools can hold native-HBAR reserves).
    receive() external payable {}
}
