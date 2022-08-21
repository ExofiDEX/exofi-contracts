module.exports = async function ({ ethers, deployments, getNamedAccounts })
{
	const { deploy } = deployments;
	const { deployer, dev } = await getNamedAccounts();

	await deploy("MagneticFieldGeneratorStore", {
		from: deployer,
		args: [],
		log: true,
		deterministicDeployment: false
	});

	const mfg = await ethers.getContract("MagneticFieldGenerator");
	const mfgs = await ethers.getContract("MagneticFieldGeneratorStore");
	const dep = mfg.provider.getSigner(deployer);
	const devSign = mfg.provider.getSigner(dev);

	if (await mfgs.owner() !== mfg.address)
	{
		// Transfer ownership to MFG
		console.log("Set MagneticFieldGeneratorStore for MagneticFieldGenerator");
		await (await mfg.connect(devSign).setStore(mfgs.address)).wait(); // Owner of MFG should already be dev
		console.log("Transfer ownership of MagneticFieldGeneratorStore to MagneticFieldGenerator");
		await (await mfgs.connect(dep).transferOwnership(mfg.address)).wait();
	}
};

module.exports.tags = ["MagneticFieldGeneratorStore"];
module.exports.dependencies = ["MagneticFieldGenerator"];
