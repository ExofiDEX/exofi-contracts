/* eslint-disable indent */
module.exports = async function ({ ethers, getNamedAccounts, deployments })
{
	const { deploy } = deployments;
	const { deployer, dev } = await getNamedAccounts();

	console.log("ExofiswapFactory - Deploying contracts with deployer: ", deployer);
	console.log("ExofiswapFactory - Deploying contracts with dev: ", dev);

	await deploy("ExofiswapFactory",
		{
			from: deployer,
			log: true,
			deterministicDeployment: false
		});

	const esf = await ethers.getContract("ExofiswapFactory");
	const dep = esf.provider.getSigner(deployer);

	const exprectedPairCodeHash = "0x2b030e03595718f09be5b952e8e9e44159b3fcf385422d5db25485106f124f44";
	const actualPairCodeHash = await esf.pairCodeHash();

	console.log("ExofiswapFactory - Verify Pair creation code hash: ", exprectedPairCodeHash);
	if (exprectedPairCodeHash !== actualPairCodeHash)
	{
		console.log("ExofiswapFactory - Pair creation code hash has unexpected value of: ", actualPairCodeHash);
		throw new Error("Pair creation code hash mismatch!");
	}
	else
	{
		console.log("ExofiswapFactory - Pair creation code hash verified");
	}

	if (await esf.owner() !== dev)
	{
		// Transfer Fermion Ownership to
		console.log("ExofiswapFactory - Transfer ExofiswapFactory Ownership to dev");
		await (await esf.connect(dep).transferOwnership(dev)).wait();
	}

	// Create Stable coin pairs....USDC_WETH, DAI_WETH, USDT_WETH
	// eslint-disable-next-line no-undef
	const chainId = await getChainId();
	let wethAddress;
	let usdcAddress;
	let usdtAddress;
	let daiAddress;
	const fermionAddress = (await ethers.getContract("Fermion")).address;
	switch (chainId)
	{
		case "1": // Mainnet
			wethAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
			usdcAddress = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
			usdtAddress = "0xdAC17F958D2ee523a2206206994597C13D831ec7";
			daiAddress = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
			break;
		case "5": // Görli
			wethAddress = "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6";
			usdcAddress = "0x3c8Bca4cEB2d32b7D49076688a06A635F84099e9";
			usdtAddress = "0xE6E1aBcE0150fDb52d2fd84BcF354B9A2CC70E5e";
			daiAddress = "0xC10c9307022c8Ab914113b0d09e5d48E342dc80a";
			break;
		default:
			throw new Error("Unknown ChainId");
	}
	let pairUsdcWeth = await esf.connect(dep).getPair(usdcAddress, wethAddress);
	let pairUsdtWeth = await esf.connect(dep).getPair(usdtAddress, wethAddress);
	let pairDaiWeth = await esf.connect(dep).getPair(daiAddress, wethAddress);
	let pairFermionUsdt = await esf.connect(dep).getPair(fermionAddress, usdtAddress);
	let pairFermionWeth = await esf.connect(dep).getPair(fermionAddress, wethAddress);

	if (pairFermionWeth === "0x0000000000000000000000000000000000000000")
	{
		console.log("ExofiswapFactory - EXOFI/WETH Pair not found, start creating...");
		await (await esf.connect(dep).createPair(fermionAddress, wethAddress)).wait();
		console.log("ExofiswapFactory - EXOFI/WETH Pair created, validate...");
		pairFermionWeth = await esf.connect(dep).getPair(fermionAddress, wethAddress);
		if (pairFermionWeth === "0x0000000000000000000000000000000000000000")
		{
			console.log("ExofiswapFactory - EXOFI/WETH Pair still not found, cancel deployment");
			throw new Error("EXOFI/WETH Pair not found");
		}
	}
	else
	{
		console.log("ExofiswapFactory - EXOFI/WETH Pair found...");
	}

	if (pairUsdcWeth === "0x0000000000000000000000000000000000000000")
	{
		console.log("ExofiswapFactory - USDC/WETH Pair not found, start creating...");
		await (await esf.connect(dep).createPair(usdcAddress, wethAddress)).wait();
		console.log("ExofiswapFactory - USDC/WETH Pair created, validate...");
		pairUsdcWeth = await esf.connect(dep).getPair(usdcAddress, wethAddress);
		if (pairUsdcWeth === "0x0000000000000000000000000000000000000000")
		{
			console.log("ExofiswapFactory - USDC/WETH Pair still not found, cancel deployment");
			throw new Error("USDC/WETH Pair not found");
		}
	}
	else
	{
		console.log("ExofiswapFactory - USDC/WETH Pair found...");
	}

	if (pairUsdtWeth === "0x0000000000000000000000000000000000000000")
	{
		console.log("ExofiswapFactory - USDT/WETH Pair not found, start creating...");
		await (await esf.connect(dep).createPair(usdtAddress, wethAddress)).wait();
		console.log("ExofiswapFactory - USDT/WETH Pair created, validate...");
		pairUsdtWeth = await esf.connect(dep).getPair(usdtAddress, wethAddress);
		if (pairUsdtWeth === "0x0000000000000000000000000000000000000000")
		{
			console.log("ExofiswapFactory - USDT/WETH Pair still not found, cancel deployment");
			throw new Error("USDT/WETH Pair not found");
		}
	}
	else
	{
		console.log("ExofiswapFactory - USDT/WETH Pair found...");
	}

	if (pairDaiWeth === "0x0000000000000000000000000000000000000000")
	{
		console.log("ExofiswapFactory - DAI/WETH Pair not found, start creating...");
		await (await esf.connect(dep).createPair(daiAddress, wethAddress)).wait();
		console.log("ExofiswapFactory - DAI/WETH Pair created, validate...");
		pairDaiWeth = await esf.connect(dep).getPair(daiAddress, wethAddress);
		if (pairDaiWeth === "0x0000000000000000000000000000000000000000")
		{
			console.log("ExofiswapFactory - DAI/WETH Pair still not found, cancel deployment");
			throw new Error("DAI/WETH Pair not found");
		}
	}
	else
	{
		console.log("ExofiswapFactory - DAI/WETH Pair found...");
	}

	if (pairFermionUsdt === "0x0000000000000000000000000000000000000000")
	{
		console.log("ExofiswapFactory - EXOFI/USDT Pair not found, start creating...");
		await (await esf.connect(dep).createPair(fermionAddress, usdtAddress)).wait();
		console.log("ExofiswapFactory - EXOFI/USDT Pair created, validate...");
		pairFermionUsdt = await esf.connect(dep).getPair(fermionAddress, usdtAddress);
		if (pairFermionUsdt === "0x0000000000000000000000000000000000000000")
		{
			console.log("ExofiswapFactory - EXOFI/USDT Pair still not found, cancel deployment");
			throw new Error("EXODA/USDT Pair not found");
		}
	}
	else
	{
		console.log("ExofiswapFactory - EXODA/USDT Pair found...");
	}

	console.log("ExofiswapFactory - EXOFI/WETH Pair address used: ", pairFermionWeth);
	console.log("ExofiswapFactory - USDC/WETH Pair address used: ", pairUsdcWeth);
	console.log("ExofiswapFactory - USDT/WETH Pair address used: ", pairUsdtWeth);
	console.log("ExofiswapFactory - DAI/WETH Pair address used: ", pairDaiWeth);
	console.log("ExofiswapFactory - EXOFI/USDT Pair address used: ", pairFermionUsdt);
};

module.exports.tags = ["ExofiswapFactory"];
module.exports.dependencies = ["Fermion"];
