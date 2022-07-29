module.exports = async function ({ ethers, getNamedAccounts, deployments })
{
	const { deploy } = deployments;
	const { deployer, dev } = await getNamedAccounts();

	await deploy("ExofiswapFactory",
		{
			from: deployer,
			log: true,
			deterministicDeployment: false
		});

	const esf = await ethers.getContract("ExofiswapFactory");
	const dep = esf.provider.getSigner(deployer);

	console.log(await esf.owner());
	console.log(deployer);
	console.log(dev);
	if (await esf.owner() !== dev)
	{
		// Transfer Fermion Ownership to
		console.log("Transfer ExofiswapFactory Ownership to dev");
		await (await esf.connect(dep).transferOwnership(dev)).wait();
	}
};

module.exports.tags = ["ExofiswapFactory"];
// module.exports.dependencies = ["UniswapV2Factory", "UniswapV2Router02"];
