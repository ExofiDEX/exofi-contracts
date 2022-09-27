module.exports = async function ({ getNamedAccounts, deployments, ethers })
{
	const { deploy } = deployments;
	const { deployer } = await getNamedAccounts();

	console.log("Planet - Deploying contracts with deployer: ", deployer);

	const fermion = await ethers.getContract("Fermion");

	await deploy("Planet",
		{
			from: deployer,
			args: [fermion.address],
			log: true,
			deterministicDeployment: false
		});
};

module.exports.tags = ["Planet"];
module.exports.dependencies = ["Fermion"];
