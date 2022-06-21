module.exports = async function ({ getNamedAccounts, deployments })
{
	const { deploy } = deployments;
	const { deployer } = await getNamedAccounts();

	await deploy("Fermion",
		{
			from: deployer,
			log: true,
			deterministicDeployment: false
		});
};

module.exports.tags = ["Fermion"];
// module.exports.dependencies = ["UniswapV2Factory", "UniswapV2Router02"];
