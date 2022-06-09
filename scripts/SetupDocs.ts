import fs from "fs";
import path from "path";

function main()
{
	const rootFolder = path.join(__dirname, "..");
	const docsFolder = path.join(rootFolder, "docs");
	const docstaticsFolder = path.join(rootFolder, "docstatics");

	// Clean up docs folder
	fs.rmSync(docsFolder, { recursive: true, force: true });
	fs.mkdirSync(docsFolder);

	// Copy contracts to package folder
	fs.cpSync(docstaticsFolder, docsFolder, { force: true, recursive: true });
}

main();
