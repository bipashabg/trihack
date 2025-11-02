'use client'
import React, { useState, useEffect } from 'react';
import { TrendingUp, Info, ChevronDown, Search, Wallet, RefreshCw } from 'lucide-react';

// Contract ABIs
const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function approve(address spender, uint256 amount) returns (bool)"
];

const LENDING_POOL_ABI = [
  "function market(uint256) view returns (uint128 totalSupplyAssets, uint128 totalSupplyShares, uint128 totalBorrowAssets, uint128 totalBorrowShares, uint128 lastUpdate, uint128 fee)",
  "function supply(uint256 id, uint256 assets, uint256 shares, address onBehalf, bytes calldata) returns (uint256, uint256)"
];

// Contract addresses
const MOCK_USDC_ADDRESS = "0x55683adB8A326cc7eb0C035f3c64bbf1272c7B0B";
const MOCK_WETH_ADDRESS = "0x52a3d539AC082CcdBae14cd2490543Ccb2C50c58";

// Mock data based on your deployment
const POOLS = [
  {
    id: 0,
    address: '0x9804Be3066EbbC26b97fe3e223710747314A529f',
    name: 'Conservative Linear',
    loanToken: 'USDC',
    collateralToken: 'WETH',
    apy: 4.23,
    totalDeposits: 478330,
    totalBorrowed: 0,
    utilization: 0,
    lltv: 80,
    irmType: 'Linear',
    irmParams: { base: '2%', slope: '13%' },
    curator: 'Steakhouse Financial'
  },
  {
    id: 1,
    address: '0xf35498dDbA364495b44Aafb67C7C3e5bc60300a2',
    name: 'Aggressive Linear',
    loanToken: 'USDC',
    collateralToken: 'WETH',
    apy: 5.85,
    totalDeposits: 100000,
    totalBorrowed: 0,
    utilization: 0,
    lltv: 80,
    irmType: 'Linear',
    irmParams: { base: '5%', slope: '25%' },
    curator: 'DeFi Capital'
  },
  {
    id: 2,
    address: '0x3dC785aa7d88a90cf7a1F312d0B17BFD9AA7e0e2',
    name: 'Optimal Kink',
    loanToken: 'USDC',
    collateralToken: 'WETH',
    apy: 3.12,
    totalDeposits: 100000,
    totalBorrowed: 0,
    utilization: 0,
    lltv: 80,
    irmType: 'Kink',
    irmParams: { base: '1%', kink: '80%', lowSlope: '11.25%', highSlope: '350%' },
    curator: 'Gauntlet'
  },
  {
    id: 3,
    address: '0x75288A8156DB6ba8eA902dc318B80FA551F5421E',
    name: 'High Efficiency Kink',
    loanToken: 'USDC',
    collateralToken: 'WETH',
    apy: 4.21,
    totalDeposits: 100000,
    totalBorrowed: 0,
    utilization: 0,
    lltv: 80,
    irmType: 'Kink',
    irmParams: { base: '2%', kink: '90%', lowSlope: '11.11%', highSlope: '1380%' },
    curator: 'Block Analitica'
  }
];

const LendingDashboard = () => {
  const [selectedPool, setSelectedPool] = useState(null);
  const [supplyAmount, setSupplyAmount] = useState('');
  const [filterDeposit, setFilterDeposit] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('apy');
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [usdcBalance, setUsdcBalance] = useState('0');
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);

  // Connect wallet function
  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ 
          method: 'eth_requestAccounts' 
        });
        setWalletAddress(accounts[0]);
        setIsWalletConnected(true);
        await fetchUSDCBalance(accounts[0]);
      } catch (error) {
        console.error('Error connecting wallet:', error);
        alert('Failed to connect wallet. Please try again.');
      }
    } else {
      alert('Please install MetaMask or another Web3 wallet!');
    }
  };

  // Fetch Mock USDC balance
  const fetchUSDCBalance = async (address) => {
    if (!address) return;
    
    // Wait for ethers to be available
    if (!window.ethers) {
      console.log('Waiting for ethers.js to load...');
      setTimeout(() => fetchUSDCBalance(address), 500);
      return;
    }
    
    setIsLoadingBalance(true);
    try {
      const provider = new window.ethers.providers.Web3Provider(window.ethereum);
      const usdcContract = new window.ethers.Contract(
        MOCK_USDC_ADDRESS,
        ERC20_ABI,
        provider
      );

      const balance = await usdcContract.balanceOf(address);
      const decimals = await usdcContract.decimals();
      
      // Format balance with decimals (USDC has 6 decimals)
      const formattedBalance = window.ethers.utils.formatUnits(balance, decimals);
      setUsdcBalance(formattedBalance);
      console.log('USDC Balance fetched:', formattedBalance);
    } catch (error) {
      console.error('Error fetching USDC balance:', error);
      setUsdcBalance('0');
    } finally {
      setIsLoadingBalance(false);
    }
  };

  // Refresh balance
  const refreshBalance = () => {
    if (walletAddress) {
      fetchUSDCBalance(walletAddress);
    }
  };

  // Load ethers.js library
  useEffect(() => {
    const loadEthers = () => {
      if (!window.ethers) {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/ethers/5.7.2/ethers.umd.min.js';
        script.async = true;
        script.onload = () => {
          console.log('Ethers.js loaded successfully');
          // Check if there's a connected wallet after ethers loads
          if (walletAddress) {
            fetchUSDCBalance(walletAddress);
          }
        };
        document.body.appendChild(script);
      }
    };
    loadEthers();
  }, []);

  // Check if wallet is already connected
  useEffect(() => {
    const checkConnection = async () => {
      if (typeof window.ethereum !== 'undefined') {
        try {
          const accounts = await window.ethereum.request({ 
            method: 'eth_accounts' 
          });
          if (accounts.length > 0) {
            setWalletAddress(accounts[0]);
            setIsWalletConnected(true);
            console.log('Wallet already connected:', accounts[0]);
            // Fetch balance after a short delay to ensure ethers is loaded
            setTimeout(() => fetchUSDCBalance(accounts[0]), 1500);
          }
        } catch (error) {
          console.error('Error checking wallet connection:', error);
        }
      }
    };
    // Check connection after a brief delay to ensure page is ready
    setTimeout(checkConnection, 500);
  }, []);

  // Listen for account changes
  useEffect(() => {
    if (typeof window.ethereum !== 'undefined') {
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
          setIsWalletConnected(true);
          fetchUSDCBalance(accounts[0]);
        } else {
          setWalletAddress('');
          setIsWalletConnected(false);
          setUsdcBalance('0');
        }
      });
    }
  }, []);

  const formatNumber = (num) => {
    if (num >= 1000000) return `$${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `$${(num / 1000).toFixed(2)}K`;
    return `$${num.toFixed(2)}`;
  };

  const filteredPools = POOLS
    .filter(pool => {
      const matchesSearch = pool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           pool.curator.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === 'apy') return b.apy - a.apy;
      if (sortBy === 'deposits') return b.totalDeposits - a.totalDeposits;
      return 0;
    });

  const handleSupply = (pool) => {
    if (!isWalletConnected) {
      alert('Please connect your wallet first');
      return;
    }
    setSelectedPool(pool);
  };

  const executeSupply = async () => {
    if (!isWalletConnected) {
      alert('Please connect your wallet first');
      return;
    }
    
    if (!supplyAmount || parseFloat(supplyAmount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    if (parseFloat(supplyAmount) > parseFloat(usdcBalance)) {
      alert('Insufficient USDC balance');
      return;
    }

    try {
      const provider = new window.ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      
      // Get pool contract address
      const poolAddress = selectedPool.address;
      
      // Create contract instances
      const usdcContract = new window.ethers.Contract(
        MOCK_USDC_ADDRESS,
        ERC20_ABI,
        signer
      );
      
      const poolContract = new window.ethers.Contract(
        poolAddress,
        LENDING_POOL_ABI,
        signer
      );

      // Convert amount to proper decimals (USDC has 6 decimals)
      const amountToSupply = window.ethers.utils.parseUnits(supplyAmount, 6);

      // Step 1: Approve USDC
      alert('Please approve USDC spending in your wallet...');
      const approveTx = await usdcContract.approve(poolAddress, amountToSupply);
      await approveTx.wait();

      // Step 2: Supply to pool
      alert('Approval successful! Now supplying to pool...');
      const supplyTx = await poolContract.supply(
        selectedPool.id,
        amountToSupply,
        0,
        walletAddress,
        "0x"
      );
      await supplyTx.wait();

      alert(`Successfully supplied ${supplyAmount} USDC to ${selectedPool.name}!`);
      
      // Refresh balance
      await fetchUSDCBalance(walletAddress);
      
      setSelectedPool(null);
      setSupplyAmount('');
    } catch (error) {
      console.error('Error supplying:', error);
      alert(`Error: ${error.message || 'Transaction failed'}`);
    }
  };

  const setMaxAmount = () => {
    setSupplyAmount(parseFloat(usdcBalance).toFixed(2));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 backdrop-blur-sm bg-white/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">L</span>
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  LendBook
                </span>
              </div>
              <div className="hidden md:flex space-x-6">
                <button className="text-sm font-medium text-blue-600 border-b-2 border-blue-600 pb-1">
                  Dashboard
                </button>
                <button className="text-sm font-medium text-slate-600 hover:text-slate-900">
                  Earn
                </button>
                <button className="text-sm font-medium text-slate-600 hover:text-slate-900">
                  Borrow
                </button>
                <button className="text-sm font-medium text-slate-600 hover:text-slate-900">
                  Markets
                </button>
              </div>
            </div>
            <button
              onClick={connectWallet}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
                isWalletConnected
                  ? 'bg-green-100 text-green-700 border border-green-300'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              <Wallet size={18} />
              <span className="text-sm">
                {isWalletConnected 
                  ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` 
                  : 'Connect Wallet'}
              </span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold text-slate-900">Your Deposits</h1>
            {isWalletConnected && (
              <div className="flex items-center space-x-4">
                <div className="bg-white rounded-lg px-4 py-2 border border-slate-200 shadow-sm">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-slate-600">Balance:</span>
                    <span className="text-lg font-bold text-slate-900">
                      {isLoadingBalance ? '...' : parseFloat(usdcBalance).toLocaleString(undefined, {maximumFractionDigits: 2})}
                    </span>
                    <span className="text-sm text-slate-600">USDC</span>
                    <button 
                      onClick={refreshBalance}
                      className="text-blue-600 hover:text-blue-700 transition-colors"
                      disabled={isLoadingBalance}
                    >
                      <RefreshCw size={16} className={isLoadingBalance ? 'animate-spin' : ''} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-600">Total Deposited</span>
                <TrendingUp size={20} className="text-blue-600" />
              </div>
              <div className="text-3xl font-bold text-slate-900">$0.00</div>
              <div className="text-xs text-slate-500 mt-1">Across all pools</div>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-600">Net APY</span>
                <div className="flex items-center space-x-1">
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                    APY
                  </span>
                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-medium">
                    Rewards
                  </span>
                </div>
              </div>
              <div className="text-3xl font-bold text-slate-900">0%</div>
              <div className="text-xs text-slate-500 mt-1">Weighted average</div>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-600">Active Positions</span>
              </div>
              <div className="text-3xl font-bold text-slate-900">0</div>
              <div className="text-xs text-slate-500 mt-1">Earning interest</div>
            </div>
          </div>
        </div>

        {/* Vaults Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="border-b border-slate-200">
            <div className="flex items-center space-x-6 px-6">
              <button className="py-4 px-1 border-b-2 border-blue-600 text-sm font-medium text-blue-600">
                Your positions
              </button>
              <button className="py-4 px-1 border-b-2 border-transparent text-sm font-medium text-slate-600 hover:text-slate-900">
                Pools
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="p-6 border-b border-slate-200 bg-slate-50">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-slate-600">Deposit:</span>
                  <button className="flex items-center space-x-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm hover:bg-slate-50">
                    <span>{filterDeposit}</span>
                    <ChevronDown size={16} />
                  </button>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-slate-600">Curator:</span>
                  <button className="flex items-center space-x-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm hover:bg-slate-50">
                    <span>All</span>
                    <ChevronDown size={16} />
                  </button>
                </div>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  placeholder="Filter pools"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-64"
                />
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                    Pool
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-600 uppercase tracking-wider cursor-pointer hover:text-slate-900">
                    <button onClick={() => setSortBy('deposits')} className="flex items-center space-x-1">
                      <span>Deposits</span>
                      <ChevronDown size={14} />
                    </button>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                    Curator
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                    Collateral
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-600 uppercase tracking-wider cursor-pointer hover:text-slate-900">
                    <button onClick={() => setSortBy('apy')} className="flex items-center space-x-1">
                      <span>APY</span>
                      <ChevronDown size={14} />
                    </button>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {filteredPools.map((pool) => (
                  <tr key={pool.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                          <span className="text-white font-bold text-sm">{pool.loanToken[0]}</span>
                        </div>
                        <div>
                          <div className="font-medium text-slate-900">{pool.name}</div>
                          <div className="text-xs text-slate-500">{pool.irmType} IRM</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{formatNumber(pool.totalDeposits)}</div>
                      <div className="text-xs text-slate-500">{pool.loanToken}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-green-700 text-xs font-bold">✓</span>
                        </div>
                        <span className="text-sm text-slate-700">{pool.curator}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <div className="flex -space-x-2">
                          <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full border-2 border-white flex items-center justify-center">
                            <span className="text-white text-xs font-bold">W</span>
                          </div>
                        </div>
                        <span className="text-sm text-slate-700">{pool.collateralToken}</span>
                        <span className="text-xs text-slate-500">({pool.lltv}% LTV)</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg font-bold text-green-600">{pool.apy}%</span>
                        <TrendingUp size={16} className="text-green-600" />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleSupply(pool)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                      >
                        Supply
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Info Banner */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start space-x-3">
          <Info size={20} className="text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-900">
            <span className="font-medium">About Interest Rate Models:</span> Linear IRMs increase steadily with utilization, 
            while Kink IRMs have two slopes—gentle before the kink point and steep after to protect liquidity.
          </div>
        </div>
      </div>

      {/* Supply Modal */}
      {selectedPool && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-900">Supply {selectedPool.loanToken}</h3>
                <button
                  onClick={() => setSelectedPool(null)}
                  className="text-slate-400 hover:text-slate-600 text-2xl"
                >
                  ×
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-slate-700">Pool Details</span>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Pool</span>
                    <span className="font-medium text-slate-900">{selectedPool.name}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Current APY</span>
                    <span className="font-bold text-green-600">{selectedPool.apy}%</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Collateral</span>
                    <span className="font-medium text-slate-900">{selectedPool.collateralToken}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Max LTV</span>
                    <span className="font-medium text-slate-900">{selectedPool.lltv}%</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Amount to Supply
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={supplyAmount}
                    onChange={(e) => setSupplyAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                    <button 
                      onClick={setMaxAmount}
                      className="text-xs text-blue-600 font-medium hover:text-blue-700"
                    >
                      MAX
                    </button>
                    <span className="text-slate-400">|</span>
                    <span className="text-sm font-medium text-slate-700">{selectedPool.loanToken}</span>
                  </div>
                </div>
                <div className="mt-2 text-xs text-slate-500">
                  Balance: {parseFloat(usdcBalance).toLocaleString(undefined, {maximumFractionDigits: 2})} {selectedPool.loanToken}
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-slate-700">Estimated yearly earnings</span>
                  <span className="font-bold text-green-700">
                    {supplyAmount ? `$${(parseFloat(supplyAmount) * selectedPool.apy / 100).toFixed(2)}` : '$0.00'}
                  </span>
                </div>
                <div className="text-xs text-slate-600">
                  Based on current {selectedPool.apy}% APY
                </div>
              </div>

              <button
                onClick={executeSupply}
                disabled={!supplyAmount || parseFloat(supplyAmount) <= 0}
                className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
              >
                {isWalletConnected ? 'Supply' : 'Connect Wallet to Supply'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LendingDashboard;