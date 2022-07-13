module.exports = async function ({ ethers, deployments, getNamedAccounts })
{
	const { deploy } = deployments;
	const { deployer, dev } = await getNamedAccounts();
	const fermion = await ethers.getContract("Fermion");

	// Max supply = 1 000 000 000 000000000000000000; // 1 Billion with 18 decimals
	// premint    =   400 000 000 000000000000000000; // 400 Million with 18 decimals
	// mint for 4 Years. 1 block ever 14 seconds
	// 4 years = 1461 days = 35040 hours = 2102400 minutes = 126144000 seconds
	// blocks in 4 years ~9010286
	// mint in 4 years = supply - premint = 600 000 000 000 000 000 000 000 000 // 600 Million with 18 decimals
	// mint per block = 600 000 000 000000000000000000 / 9010286 = 66590561054332792543
	const fermionPerBlock = "60000000000000000000"; // 60 Fermion

	const { address } = await deploy("MagneticFieldGenerator", {
		from: deployer,
		args: [fermion.address, fermionPerBlock, "0"],
		log: true,
		deterministicDeployment: false
	});

	const dep = fermion.provider.getSigner(deployer);

	if (await fermion.owner() !== address)
	{
		// Transfer Fermion Ownership to
		console.log("Transfer Fermion Ownership to MagneticFieldGenerator");
		await (await fermion.connect(dep).transferOwnership(address)).wait();
	}

	const mfg = await ethers.getContract("MagneticFieldGenerator");
	if (await mfg.owner() !== dev)
	{
		// Transfer ownership of MasterChef to dev
		console.log("Transfer ownership of MagneticFieldGenerator to dev");
		await (await mfg.connect(dep).transferOwnership(dev)).wait();
	}

	const uniMig = await ethers.getContract("UniMigrator");
	if (await mfg.migrator() !== uniMig.address)
	{
		// Set Migrator to UniMigrator
		console.log("Set Migrator of MagneticFieldGenerator to UniMigrator");
		await (await mfg.connect(dep).setMigrator(uniMig.address)).wait();
	}
};

module.exports.tags = ["MagneticFieldGenerator"];
module.exports.dependencies = ["Fermion", "UniMigrator"];
