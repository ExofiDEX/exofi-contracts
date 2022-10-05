module.exports = async function ({ ethers, getNamedAccounts })
{
	const { deployer } = await getNamedAccounts();
	const fermion = await ethers.getContract("Fermion");

	const dep = fermion.provider.getSigner(deployer);

	const mfg = await ethers.getContract("MagneticFieldGenerator");

	const mfgPools = await mfg.poolLength();
	if (mfgPools.toNumber() === 0)
	{
		const factory = await ethers.getContract("ExofiswapFactory");
		const pairsCount = (await factory.allPairsLength()).toNumber();
		for (let i = 0; i < pairsCount; ++i)
		{
			const pair = await factory.allPairs(i);
			console.log("MagneticFieldGeneratorPools - Add MFG Pool with pair: ", pair);
			await (await mfg.connect(dep).add(100, pair, 0)).wait(2);
		}

		console.log("MagneticFieldGeneratorPools - Add MFG Pool with Fermion");
		await (await mfg.connect(dep).add(100, fermion.address, 0)).wait(2);
	}
};

module.exports.tags = ["MagneticFieldGeneratorPools"];
module.exports.dependencies = ["MagneticFieldGenerator", "MagneticFieldGeneratorStore", "ExofiswapFactory", "Fermion"];
