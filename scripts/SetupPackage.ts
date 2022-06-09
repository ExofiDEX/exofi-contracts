import fs from "fs";
import path from "path";

// DO NOT DELETE THIS FILE
// This file is used by build system to build a clean npm package.
// It will not be included in the npm package

function main()
{
	const rootFolder = path.join(__dirname, "..");
	const packageFolder = path.join(rootFolder, "package");
	const contractsFolder = path.join(rootFolder, "contracts");
	const mockFolder = path.join(packageFolder, "contracts/mocks");

	// Clean up package folder
	fs.rmSync(packageFolder, { recursive: true, force: true });
	fs.mkdirSync(packageFolder);

	// Copy contracts to package folder
	fs.cpSync(contractsFolder, path.join(packageFolder, "contracts"), { force: true, recursive: true });
	// Remove mocks
	fs.rmSync(mockFolder, { recursive: true, force: true });
	// fs.cpSync(interfacesFolder, path.join(packageFolder, "interfaces"), { force: true, recursive: true });

	// Copy package.json to package folder
	const source = fs.readFileSync(path.join(rootFolder, "package.json")).toString("utf-8");
	const sourceObj = JSON.parse(source);
	sourceObj.scripts = undefined;
	sourceObj.devDependencies = undefined;
	sourceObj.engines = undefined;
	fs.writeFileSync(path.join(packageFolder, "package.json"), Buffer.from(JSON.stringify(sourceObj, null, 2), "utf-8"));

	// Create version.txt
	fs.writeFileSync(path.join(packageFolder, "version.txt"), Buffer.from(sourceObj.version, "utf-8"));
}

main();
