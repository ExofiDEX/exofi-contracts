module.exports = async function ({ getNamedAccounts, deployments, ethers })
{
	const { deploy } = deployments;
	const { deployer } = await getNamedAccounts();

	console.log("Planet - Deploying contracts with deployer: ", deployer);

	const fermion = await ethers.getContract("Fermion");

	const { address } = await deploy("Planet",
		{
			from: deployer,
			log: true,
			deterministicDeployment: false
		});

	const planet = await ethers.getContract("Planet");
	const dep = planet.provider.getSigner(deployer);
	const token = await planet.token();
	if (token === "0x0000000000000000000000000000000000000000")
	{
		console.log("Planet - Initialize with Fermion with deployer: ", deployer);
		await (await planet.connect(dep).initialize(fermion.address)).wait();
	}
};

module.exports.tags = ["Planet"];
module.exports.dependencies = ["Fermion"];
