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

	if (await esf.owner() !== dev)
	{
		// Transfer Fermion Ownership to
		console.log("ExofiswapFactory - Transfer ExofiswapFactory Ownership to dev");
		await (await esf.connect(dep).transferOwnership(dev)).wait();
	}
};

module.exports.tags = ["ExofiswapFactory"];
// module.exports.dependencies = ["UniswapV2Factory", "UniswapV2Router02"];
