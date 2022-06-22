module.exports = async function ({ ethers, deployments, getNamedAccounts })
{
	const { deploy } = deployments;
	const { deployer, dev } = await getNamedAccounts();
	const fermion = await ethers.getContract("Fermion");

	const { address } = await deploy("MagneticFieldGenerator", {
		from: deployer,
		args: [fermion.address, dev, "1000000000000000000000", "0"],
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
	if (await mfg.owner() !== dev.address)
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
		await (await mfg.connect(dep).setMigrator(uniMig)).wait();
	}
};

module.exports.tags = ["MagneticFieldGenerator"];
module.exports.dependencies = ["Fermion", "UniMigrator"];
