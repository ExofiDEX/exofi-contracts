module.exports = async function ({ ethers, getNamedAccounts, deployments })
{
	const { deploy } = deployments;
	const { deployer } = await getNamedAccounts();

	console.log("FermionReactor - Deploying contracts with deployer: ", deployer);

	const fermion = await ethers.getContract("Fermion");

	await deploy("FermionReactor",
		{
			from: deployer,
			args: ["100000000000000000", "100000000000000000000", fermion.address, "15525"],
			log: true,
			deterministicDeployment: false
		});
};

module.exports.tags = ["FermionReactor"];
module.exports.dependencies = ["Fermion"];
