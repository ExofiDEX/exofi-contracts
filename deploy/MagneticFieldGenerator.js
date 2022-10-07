/* eslint-disable indent */
module.exports = async function ({ ethers, deployments, getNamedAccounts })
{
	const { deploy } = deployments;
	const { deployer, dev } = await getNamedAccounts();
	const fermion = await ethers.getContract("Fermion");
	const planet = await ethers.getContract("Planet");

	// Max supply = 1 000 000 000 000000000000000000; // 1 Billion with 18 decimals
	// premint    =   400 000 000 000000000000000000; // 400 Million with 18 decimals
	// mint for 4 Years. 1 block ever 12 seconds
	// 4 years = 1461 days = 35040 hours = 2102400 minutes = 126144000 seconds
	// blocks in 4 years 10512000
	// mint in 4 years = supply - premint = 600 000 000 000 000 000 000 000 000 // 600 Million with 18 decimals
	// mint per block = 600 000 000 000000000000000000 / 10512000 = 57_077_625_570_776_255_708
	const fermionPerBlock = "50000000000000000000"; // 50 Fermion <- Biggest number that will get you at least 4 years and divides 600M without fraction.

	// eslint-disable-next-line no-undef
	const chainId = await getChainId();
	let startBlock = "0";
	switch (chainId)
	{
		case "1": // Mainnet
			startBlock = "15713777";
			break;
		case "5": // Görli
			startBlock = "0";
			break;
		default:
			throw new Error("Unknown ChainId");
	}
	console.log("MagneticFieldGenerator - Deploying contracts with deployer: ", deployer);
	console.log("MagneticFieldGenerator - Deploying contracts with dev: ", dev);
	console.log("MagneticFieldGenerator - Deploying contracts with fermion.address: ", fermion.address);
	console.log("MagneticFieldGenerator - Deploying contracts with planet.address: ", planet.address);
	console.log("MagneticFieldGenerator - Deploying contracts with fermionPerBlock: ", fermionPerBlock);
	console.log("MagneticFieldGenerator - Deploying contracts with startBlock: ", startBlock);

	const { address } = await deploy("MagneticFieldGenerator", {
		from: deployer,
		args: [fermion.address, planet.address, fermionPerBlock, startBlock],
		log: true,
		deterministicDeployment: false
	});

	const dep = fermion.provider.getSigner(deployer);

	if (await fermion.owner() !== address)
	{
		// Transfer Fermion Ownership to
		console.log("MagneticFieldGenerator - Transfer Fermion Ownership to MagneticFieldGenerator");
		await (await fermion.connect(dep).transferOwnership(address)).wait();
	}

	if (await planet.owner() !== address)
	{
		// Transfer Planet Ownership to
		console.log("MagneticFieldGenerator - Transfer Planet Ownership to MagneticFieldGenerator");
		await (await planet.connect(dep).transferOwnership(address)).wait();
	}

	const mfg = await ethers.getContract("MagneticFieldGenerator");
	if (await mfg.owner() !== dev)
	{
		// Transfer ownership of MasterChef to dev
		console.log("MagneticFieldGenerator - Transfer ownership of MagneticFieldGenerator to dev");
		await (await mfg.connect(dep).transferOwnership(dev)).wait();
	}

	// const uniMig = await ethers.getContract("UniMigrator");
	// if (await mfg.migrator() !== uniMig.address)
	// {
	// // Set Migrator to UniMigrator
	// console.log("Set Migrator of MagneticFieldGenerator to UniMigrator");
	// await (await mfg.connect(dep).setMigrator(uniMig.address)).wait();
	// }
};

module.exports.tags = ["MagneticFieldGenerator"];
module.exports.dependencies = ["Fermion", "Planet"];
