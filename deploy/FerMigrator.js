module.exports = async function (/* { getNamedAccounts, deployments, ethers } */)
{
	// const { deploy } = deployments;
	// const { deployer, dev } = await getNamedAccounts();

	// console.log("FerMigrator - Deploying contracts with deployer: ", deployer);
	// console.log("FerMigrator - Deploying contracts with dev: ", dev);

	// const planet = await ethers.getContract("Planet");
	// const mfg = await ethers.getContract("MagneticFieldGenerator");

	// await deploy("FerMigrator", {
	// from: deployer,
	// args: [mfg.address, planet.address],
	// log: true,
	// deterministicDeployment: false
	// });

	// const ferMig = await ethers.getContract("FerMigrator");
	// const dep = ferMig.provider.getSigner(deployer);
	// if (await mfg.migrator() !== ferMig.address)
	// {
	// // Set Migrator to UniMigrator
	// console.log("Set Migrator of MagneticFieldGenerator to FerMigrator");
	// await (await mfg.connect(dep).setMigrator(ferMig.address)).wait();
	// await (await mfg.connect(dep).migrate(8)).wait();
	// }
};

module.exports.tags = ["FerMigrator"];
module.exports.dependencies = ["Planet", "MagneticFieldGenerator"];
