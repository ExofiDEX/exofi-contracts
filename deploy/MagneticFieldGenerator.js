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

	const masterChef = await ethers.getContract("MagneticFieldGenerator");
	if (await masterChef.owner() !== dev)
	{
		// Transfer ownership of MasterChef to dev
		console.log("Transfer ownership of MagneticFieldGenerator to dev");
		await (await masterChef.connect(dep).transferOwnership(dev)).wait();
	}
};

module.exports.tags = ["MagneticFieldGenerator"];
// module.exports.dependencies = ["UniswapV2Factory", "UniswapV2Router02", "SushiToken"];
module.exports.dependencies = ["Fermion"];
