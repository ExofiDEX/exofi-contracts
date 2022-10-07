/* eslint-disable indent */
module.exports = async function ({ ethers, getNamedAccounts })
{
	const { deployer } = await getNamedAccounts();
	const fermion = await ethers.getContract("Fermion");

	const dep = fermion.provider.getSigner(deployer);

	const mfg = await ethers.getContract("MagneticFieldGenerator");

	let lockPeriod = 0;

	// eslint-disable-next-line no-undef
	const chainId = await getChainId();
	switch (chainId)
	{
		case "1": // Mainnet
			lockPeriod = 216000; // 30 days
			break;
		case "5": // Görli
			lockPeriod = 0;
			break;
		default:
			throw new Error("Unknown ChainId");
	}

	const mfgPools = await mfg.poolLength();
	if (mfgPools.toNumber() === 0)
	{
		console.log("MagneticFieldGeneratorPools - Add MFG Pool with Fermion");
		await (await mfg.connect(dep).add(100, fermion.address, lockPeriod)).wait(2);

		const factory = await ethers.getContract("ExofiswapFactory");
		const pairsCount = (await factory.allPairsLength()).toNumber();
		let alloc = 300; // EXOFI/WETH is the first Pair and gehts a bit more allocPoints

		for (let i = 0; i < pairsCount; ++i)
		{
			const pair = await factory.allPairs(i);
			console.log("MagneticFieldGeneratorPools - Add MFG Pool with pair: ", pair);
			await (await mfg.connect(dep).add(alloc, pair, lockPeriod)).wait(2);
			alloc = 200;
		}

	}
};

module.exports.tags = ["MagneticFieldGeneratorPools"];
module.exports.dependencies = ["MagneticFieldGenerator", "MagneticFieldGeneratorStore", "ExofiswapFactory", "Fermion"];
