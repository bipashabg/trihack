// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import {Script} from "forge-std/Script.sol";
import {Orderbook} from "../contracts/orderbook/Orderbook.sol";
import {LendingPool} from "../contracts/lending-core/LendingPool.sol";
import {LinearIRM} from "../contracts/lending-core/LinearIRM.sol";
import {KinkIRM} from "../contracts/lending-core/KinkIRM.sol";
import {PythOracle} from "../contracts/oracles/PythOracle.sol";
import {MarketParams} from "../contracts/interfaces/IMorpho.sol";
import {MockUSDC} from "../contracts/mocks/MockUSDC.sol";
import {MockWETH} from "../contracts/mocks/MockWETH.sol";
import {console} from "forge-std/console.sol";

contract DeployWithMocks is Script {
    address public constant PYTH_SEPOLIA = 0xDd24F84d36BF92C65F92307595335bdFab5Bbd21;
    bytes32 public constant ETH_USD_PRICE_ID = 0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace;
    
    uint256 constant WAD = 1e18;
    uint256 constant SECONDS_PER_YEAR = 365 * 24 * 60 * 60;
    uint256 constant POOL_LIQUIDITY = 100_000 * 1e6; // 100k USDC per pool
    uint256 constant DEPLOYER_WETH = 100 * 1e18; // 100 WETH
    
    struct Deployments {
        PythOracle oracle;
        Orderbook orderbook;
        MockUSDC usdc;
        MockWETH weth;
        LendingPool pool0;
        LendingPool pool1;
        LendingPool pool2;
        LendingPool pool3;
    }
    
    function run() external {
        uint256 key = vm.envUint("PVT_KEY");
        address deployer = vm.addr(key);
        
        Deployments memory d;
        
        console.log("Deployer:", deployer);
        
        d = _deployMockTokens(key, d, deployer);
        d.oracle = _deployOracle(key);
        d.orderbook = _deployOrderbook(key, address(d.usdc), address(d.weth));
        
        (LinearIRM irm1, LinearIRM irm2, KinkIRM kirm1, KinkIRM kirm2) = _deployIRMs(key);
        
        d = _deployPools(key, d);
        
        _createMarkets(key, d, irm1, irm2, kirm1, kirm2);
        
        _fundPools(key, d, deployer);
        
        _registerPools(key, d);
        
        _logAddresses(d);
    }
    
    function _deployMockTokens(uint256 key, Deployments memory d, address deployer) internal returns (Deployments memory) {
        console.log("\nDeploying Mock Tokens");
        
        vm.broadcast(key);
        d.usdc = new MockUSDC();
        console.log("Mock USDC:", address(d.usdc));
        
        vm.broadcast(key);
        d.weth = new MockWETH();
        console.log("Mock WETH:", address(d.weth));
        
        // Mint tokens to deployer
        console.log("\nMinting tokens to deployer");
        
        vm.broadcast(key);
        d.usdc.mint(deployer, POOL_LIQUIDITY * 4); // 400k USDC for 4 pools
        console.log("Minted 400k USDC to deployer");
        
        vm.broadcast(key);
        d.weth.mint(deployer, DEPLOYER_WETH);
        console.log("Minted 100 WETH to deployer");
        
        return d;
    }
    
    function _deployOracle(uint256 key) internal returns (PythOracle) {
        console.log("\nDeploying Pyth Oracle");
        vm.broadcast(key);
        PythOracle oracle = new PythOracle(PYTH_SEPOLIA, ETH_USD_PRICE_ID, 36);
        console.log("Oracle:", address(oracle));
        return oracle;
    }
    
    function _deployOrderbook(uint256 key, address usdc, address weth) internal returns (Orderbook) {
        console.log("\nDeploying Orderbook");
        vm.broadcast(key);
        Orderbook ob = new Orderbook(usdc, weth);
        console.log("Orderbook:", address(ob));
        return ob;
    }
    
    function _deployIRMs(uint256 key) internal returns (
        LinearIRM irm1,
        LinearIRM irm2,
        KinkIRM kirm1,
        KinkIRM kirm2
    ) {
        console.log("\nDeploying IRMs");
        
        vm.broadcast(key);
        irm1 = new LinearIRM(
            (2 * WAD / 100) / SECONDS_PER_YEAR,
            (13 * WAD / 100) / SECONDS_PER_YEAR
        );
        
        vm.broadcast(key);
        irm2 = new LinearIRM(
            (5 * WAD / 100) / SECONDS_PER_YEAR,
            (25 * WAD / 100) / SECONDS_PER_YEAR
        );
        
        vm.broadcast(key);
        kirm1 = new KinkIRM(
            (1 * WAD / 100) / SECONDS_PER_YEAR,
            (80 * WAD) / 100,
            (1125 * WAD / 10000) / SECONDS_PER_YEAR,
            (350 * WAD / 100) / SECONDS_PER_YEAR
        );
        
        vm.broadcast(key);
        kirm2 = new KinkIRM(
            (2 * WAD / 100) / SECONDS_PER_YEAR,
            (90 * WAD) / 100,
            (1111 * WAD / 10000) / SECONDS_PER_YEAR,
            (1380 * WAD / 100) / SECONDS_PER_YEAR
        );
        
        console.log("IRMs deployed");
    }
    
    function _deployPools(uint256 key, Deployments memory d) internal returns (Deployments memory) {
        console.log("\nDeploying Pools");
        
        vm.broadcast(key);
        d.pool0 = new LendingPool();
        
        vm.broadcast(key);
        d.pool1 = new LendingPool();
        
        vm.broadcast(key);
        d.pool2 = new LendingPool();
        
        vm.broadcast(key);
        d.pool3 = new LendingPool();
        
        console.log("Pools deployed");
        return d;
    }
    
    function _createMarkets(
        uint256 key,
        Deployments memory d,
        LinearIRM irm1,
        LinearIRM irm2,
        KinkIRM kirm1,
        KinkIRM kirm2
    ) internal {
        console.log("\nCreating Markets");
        
        vm.broadcast(key);
        d.pool0.createMarket(_params(d, address(irm1)), 1);
        
        vm.broadcast(key);
        d.pool1.createMarket(_params(d, address(irm2)), 2);
        
        vm.broadcast(key);
        d.pool2.createMarket(_params(d, address(kirm1)), 3);
        
        vm.broadcast(key);
        d.pool3.createMarket(_params(d, address(kirm2)), 4);
        
        console.log("Markets created");
    }
    
    function _fundPools(uint256 key, Deployments memory d, address deployer) internal {
        console.log("\nFunding Pools with Initial Liquidity");
        
        // Fund Pool 0
        vm.broadcast(key);
        d.usdc.approve(address(d.pool0), POOL_LIQUIDITY);
        vm.broadcast(key);
        d.pool0.supply(1, POOL_LIQUIDITY, 0, deployer, "");
        console.log("Pool 0 funded with 100k USDC");
        
        // Fund Pool 1
        vm.broadcast(key);
        d.usdc.approve(address(d.pool1), POOL_LIQUIDITY);
        vm.broadcast(key);
        d.pool1.supply(2, POOL_LIQUIDITY, 0, deployer, "");
        console.log("Pool 1 funded with 100k USDC");
        
        // Fund Pool 2
        vm.broadcast(key);
        d.usdc.approve(address(d.pool2), POOL_LIQUIDITY);
        vm.broadcast(key);
        d.pool2.supply(3, POOL_LIQUIDITY, 0, deployer, "");
        console.log("Pool 2 funded with 100k USDC");
        
        // Fund Pool 3
        vm.broadcast(key);
        d.usdc.approve(address(d.pool3), POOL_LIQUIDITY);
        vm.broadcast(key);
        d.pool3.supply(4, POOL_LIQUIDITY, 0, deployer, "");
        console.log("Pool 3 funded with 100k USDC");
        
        console.log("\nAll pools funded successfully");
        console.log("Total liquidity: 400k USDC");
    }
    
    function _registerPools(uint256 key, Deployments memory d) internal {
        console.log("\nRegistering Pools");
        
        vm.broadcast(key);
        d.orderbook.registerPool(address(d.pool0), 1);
        
        vm.broadcast(key);
        d.orderbook.registerPool(address(d.pool1), 2);
        
        vm.broadcast(key);
        d.orderbook.registerPool(address(d.pool2), 3);
        
        vm.broadcast(key);
        d.orderbook.registerPool(address(d.pool3), 4);
        
        console.log("Pools registered");
    }
    
    function _params(Deployments memory d, address irm) internal pure returns (MarketParams memory) {
        return MarketParams({
            loanToken: address(d.usdc),
            collateralToken: address(d.weth),
            oracle: address(d.oracle),
            irm: irm,
            lltv: 800000000000000000
        });
    }
    
    function _logAddresses(Deployments memory d) internal view {
        console.log("\n=== Deployment Complete ===");
        console.log("Mock USDC:", address(d.usdc));
        console.log("Mock WETH:", address(d.weth));
        console.log("Pyth Oracle:", address(d.oracle));
        console.log("Orderbook:", address(d.orderbook));
        console.log("Pool 0:", address(d.pool0), "(100k USDC)");
        console.log("Pool 1:", address(d.pool1), "(100k USDC)");
        console.log("Pool 2:", address(d.pool2), "(100k USDC)");
        console.log("Pool 3:", address(d.pool3), "(100k USDC)");
        console.log("\nTotal Liquidity: 400k USDC");
    }
}