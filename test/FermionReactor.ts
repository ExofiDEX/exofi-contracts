import { ethers } from "hardhat";
import { expect } from "chai";
import { Contract, ContractFactory } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

import { ADDRESS_ZERO, EmitOnlyThis, ExpandTo18Decimals } from "./helpers";

import { IFermion, IFermionReactor, IOwnable, IERC20 } from "../typechain-types";

describe("FermionReactor", () =>
{
	let FermionReactorFactory: ContractFactory;
	let FermionFactory: ContractFactory;
	let ERC20Factory: ContractFactory;
	let Signers: SignerWithAddress[];
	let Alice: SignerWithAddress;
	let Bob: SignerWithAddress;
	let Carol: SignerWithAddress;
	let Dave: SignerWithAddress;
	let ContractFermionReactor: Contract;
	let ContractFermion: Contract;

	before(async () =>
	{
		FermionReactorFactory = await ethers.getContractFactory("FermionReactor");
		FermionFactory = await ethers.getContractFactory("Fermion");
		ERC20Factory = await ethers.getContractFactory("ERC20Mock");
		Signers = await ethers.getSigners();
		Alice = Signers[0];
		Bob = Signers[1];
		Carol = Signers[2];
		Dave = Signers[3];
	});

	context("this", async () =>
	{
		const FermionReactor = () => ContractFermionReactor as IFermionReactor;
		const Fermion = () => ContractFermion as IFermion;

		beforeEach(async () =>
		{
			await setupTest(1, 3, 12000);
			// Fill Fermion Reactor with Fermions (Alice)
			await Fermion().transfer(FermionReactor().address, ExpandTo18Decimals(100000));
			// Delete all Fermions Alice owns. They are not needed for the tests.
			await Fermion().burn(await Fermion().balanceOf(Alice.address));
		});

		it("FermionReactor.constructor: Should emit OwnershipTransferred event", async () =>
		{
			// Act
			const result = ContractFermionReactor.deployTransaction;
			// Assert
			await expect(result).to.emit(ContractFermionReactor, "OwnershipTransferred(address,address)").withArgs(ADDRESS_ZERO, Alice.address);
			await EmitOnlyThis(result, ContractFermionReactor, "OwnershipTransferred(address,address)");
		});

		it("FermionReactor.constructor: Should initialize correctly", async () =>
		{
			// Act
			// Done in beforeEach with valies lowerLimit: 1, upperLimit: 3, rate; 12000
			// Assert
			expect(await FermionReactor().getFermionAddress()).to.equal(Fermion().address);
			expect(await FermionReactor().getLowerEthLimit()).to.equal(1_000_000_000_000_000_000n);
			expect(await FermionReactor().getUpperEthLimit()).to.equal(3_000_000_000_000_000_000n);
			expect(await FermionReactor().getRate()).to.equal(12000n);
			expect(await FermionReactor().isActive()).to.equal(true);
		});

		it("FermionReactor.buyFermion: Should let one user buy Fermions", async () =>
		{
			// Arrange
			const buyEth = ExpandTo18Decimals(2);
			const expectedEthBalance = buyEth.add(await Alice.getBalance());
			const expectedFermion = ExpandTo18Decimals(24000);
			const expectedFermionBalance = ExpandTo18Decimals(100000).sub(expectedFermion);
			// Act
			const result = await FermionReactor().connect(Bob).buyFermion({ value: buyEth });
			// Assert
			await expect(result).to.emit(ContractFermionReactor, "Buy(address,uint256,uint256)").withArgs(Bob.address, buyEth, expectedFermion);
			await EmitOnlyThis(result, ContractFermionReactor, "Buy(address,uint256,uint256)");
			expect(await Alice.getBalance()).to.equal(expectedEthBalance);
			expect(await Fermion().balanceOf(FermionReactor().address)).to.equal(expectedFermionBalance);
			expect(await Fermion().balanceOf(Bob.address)).to.equal(expectedFermion);
		});

		it("FermionReactor.buyFermion: Should give the last one the remaining Fermion", async () =>
		{
			// Arrange
			const buyEthMin = ExpandTo18Decimals(1);
			const buyEthMax = ExpandTo18Decimals(3);
			const expectedEthBalance = (await Alice.getBalance()).add(ExpandTo18Decimals(7)).add(1_333_333_333_333_333_333n);
			const expectedFermionMin = ExpandTo18Decimals(12000);
			const expectedFermionMax = ExpandTo18Decimals(36000);
			const expectedFermionLast = ExpandTo18Decimals(16000);
			const buyEthLast = expectedFermionLast.div(12000);
			// Act
			const result1 = await FermionReactor().connect(Bob).buyFermion({ value: buyEthMin }); // = 12000 EXOFI
			const result2 = await FermionReactor().connect(Carol).buyFermion({ value: buyEthMax }); // = 36000 EXOFI (48000)
			const result3 = await FermionReactor().connect(Carol).buyFermion({ value: buyEthMax }); // = 36000 EXOFI (84000)
			const result4 = await FermionReactor().connect(Dave).buyFermion({ value: buyEthMax }); // = 36000->16000 EXOFI (120000->100000)

			// Assert
			await expect(result1).to.emit(ContractFermionReactor, "Buy(address,uint256,uint256)").withArgs(Bob.address, buyEthMin, expectedFermionMin);
			await EmitOnlyThis(result1, ContractFermionReactor, "Buy(address,uint256,uint256)");
			await expect(result2).to.emit(ContractFermionReactor, "Buy(address,uint256,uint256)").withArgs(Carol.address, buyEthMax, expectedFermionMax);
			await EmitOnlyThis(result2, ContractFermionReactor, "Buy(address,uint256,uint256)");
			await expect(result3).to.emit(ContractFermionReactor, "Buy(address,uint256,uint256)").withArgs(Carol.address, buyEthMax, expectedFermionMax);
			await EmitOnlyThis(result3, ContractFermionReactor, "Buy(address,uint256,uint256)");
			await expect(result4).to.emit(ContractFermionReactor, "Buy(address,uint256,uint256)").withArgs(Dave.address, buyEthLast, expectedFermionLast);
			await EmitOnlyThis(result4, ContractFermionReactor, "Buy(address,uint256,uint256)");
			expect(await Alice.getBalance()).to.equal(expectedEthBalance);
			expect(await Fermion().balanceOf(FermionReactor().address)).to.equal(0);
			expect(await Fermion().balanceOf(Bob.address)).to.equal(ExpandTo18Decimals(12000));
			expect(await Fermion().balanceOf(Carol.address)).to.equal(ExpandTo18Decimals(72000));
			expect(await Fermion().balanceOf(Dave.address)).to.equal(ExpandTo18Decimals(16000));
		});

		it("FermionReactor.buyFermion: Should not allow buy under lower limit", async () =>
		{
			// Arrange
			const buyEth = ExpandTo18Decimals(1).sub(1);
			const expectedEthBalance = await Alice.getBalance();
			const expectedFermion = ExpandTo18Decimals(0);
			const expectedFermionBalance = ExpandTo18Decimals(100000).sub(expectedFermion);
			// Act
			const result = FermionReactor().connect(Bob).buyFermion({ value: buyEth });
			// Assert
			await expect(result).to.revertedWith("FR: Insufficient ETH");
			expect(await Alice.getBalance()).to.equal(expectedEthBalance);
			expect(await Fermion().balanceOf(FermionReactor().address)).to.equal(expectedFermionBalance);
			expect(await Fermion().balanceOf(Bob.address)).to.equal(expectedFermion);
		});

		it("FermionReactor.buyFermion: Should not allow buy over upper limit", async () =>
		{
			// Arrange
			const buyEth = ExpandTo18Decimals(3).add(1);
			const expectedEthBalance = await Alice.getBalance();
			const expectedFermion = ExpandTo18Decimals(0);
			const expectedFermionBalance = ExpandTo18Decimals(100000).sub(expectedFermion);
			// Act
			const result = FermionReactor().connect(Bob).buyFermion({ value: buyEth });
			// Assert
			await expect(result).to.revertedWith("FR: ETH exceeds upper Limit");
			expect(await Alice.getBalance()).to.equal(expectedEthBalance);
			expect(await Fermion().balanceOf(FermionReactor().address)).to.equal(expectedFermionBalance);
			expect(await Fermion().balanceOf(Bob.address)).to.equal(expectedFermion);
		});

		it("FermionReactor.buyFermion: Should not allow buy when deactivated", async () =>
		{
			// Arrange
			await FermionReactor().disable();
			const buyEth = ExpandTo18Decimals(2);
			const expectedEthBalance = await Alice.getBalance();
			const expectedFermion = ExpandTo18Decimals(0);
			const expectedFermionBalance = ExpandTo18Decimals(100000).sub(expectedFermion);
			// Act
			const result = FermionReactor().connect(Bob).buyFermion({ value: buyEth });
			// Assert
			await expect(result).to.revertedWith("FR: Contract is not active");
			expect(await Alice.getBalance()).to.equal(expectedEthBalance);
			expect(await Fermion().balanceOf(Alice.address)).to.equal(expectedFermionBalance);
			expect(await Fermion().balanceOf(FermionReactor().address)).to.equal(0);
			expect(await Fermion().balanceOf(Bob.address)).to.equal(expectedFermion);
		});

		it("FermionReactor.disable: Should disable contract", async () =>
		{
			// Arrange
			const expectedFermionBalance = ExpandTo18Decimals(100000);
			// Act
			await FermionReactor().disable();
			// Assert
			expect(await Fermion().balanceOf(Alice.address)).to.equal(expectedFermionBalance);
			expect(await Fermion().balanceOf(FermionReactor().address)).to.equal(0);
			expect(await FermionReactor().isActive()).to.equal(false);
		});

		it("FermionReactor.disable: Should not allow non-owner to disable contract", async () =>
		{
			// Arrange
			// Act
			const result = FermionReactor().connect(Bob).disable();
			// Assert
			await expect(result).to.revertedWith("Ownable: caller is not the owner");
		});

		it("FermionReactor.transferOtherERC20Token: Should not allow non-owner to remove ERC20-token", async () =>
		{
			// Arrange
			const mockToken = (await ERC20Factory.deploy("MockToken", "MKT", ExpandTo18Decimals(10000))) as IERC20;
			await mockToken.transfer(FermionReactor().address, 1000);
			// Act
			const result = FermionReactor().connect(Bob).transferOtherERC20Token(mockToken.address);
			// Assert
			await expect(result).to.revertedWith("Ownable: caller is not the owner");
		});

		it("FermionReactor.transferOtherERC20Token: Should not allow to remove Fermion-token", async () =>
		{
			// Arrange
			// Act
			const result = FermionReactor().transferOtherERC20Token(Fermion().address);
			// Assert
			await expect(result).to.revertedWith("FR: Fermion can not be removed.");
		});

		it("FermionReactor.transferOtherERC20Token: Should allow owner to remove ERC20-token", async () =>
		{
			// Arrange
			const mockToken = (await ERC20Factory.deploy("MockToken", "MKT", ExpandTo18Decimals(10000))) as IERC20;
			await mockToken.transfer(FermionReactor().address, 1000);
			const expectedMockTokenAmount = (await mockToken.balanceOf(Alice.address)).add(1000);
			// Act
			await FermionReactor().transferOtherERC20Token(mockToken.address);
			// Assert
			expect(await mockToken.balanceOf(FermionReactor().address)).to.equal(0);
			expect(await mockToken.balanceOf(Alice.address)).to.equal(expectedMockTokenAmount);
		});
	});

	context("IOwnable", async () =>
	{
		const Ownable = () => ContractFermionReactor as IOwnable;

		beforeEach(async () =>
		{
			await setupTest(1, 3, 12000);
		});

		it("FermionReactor.constructor: Should set creator as owner", async () =>
		{
			// Arrange
			// Act
			const resultOwner = await Ownable().owner();

			// Assert
			expect(resultOwner).to.equal(Alice.address);
		});

		it("FermionReactor.renounceOwnership: Should let owner renounce ownership", async () =>
		{
			// Arrange
			// Act
			const result = await Ownable().renounceOwnership();
			// Assert
			await expect(result).to.emit(ContractFermionReactor, "OwnershipTransferred(address,address)").withArgs(Alice.address, ADDRESS_ZERO);
			await EmitOnlyThis(result, ContractFermionReactor, "OwnershipTransferred(address,address)");
			expect(await Ownable().owner()).to.equal(ADDRESS_ZERO);
		});

		it("Fermion.renounceOwnership: Should not let non-owner renounce ownership", async () =>
		{
			// Arrange
			// Act
			const result = Ownable().connect(Bob).renounceOwnership();
			// Assert
			expect(result).to.revertedWith("Ownable: caller is not the owner");
			expect(await Ownable().owner()).to.equal(Alice.address);
		});

		it("Fermion.transferOwnership: Should let owner transfer ownership", async () =>
		{
			// Arrange
			// Act
			const result = await Ownable().transferOwnership(Bob.address);
			// Assert
			await expect(result).to.emit(ContractFermionReactor, "OwnershipTransferred(address,address)").withArgs(Alice.address, Bob.address);
			await EmitOnlyThis(result, ContractFermionReactor, "OwnershipTransferred(address,address)");
			expect(await Ownable().owner()).to.equal(Bob.address);
		});

		it("Fermion.transferOwnership: Should not let owner transfer ownership to zero address", async () =>
		{
			// Arrange
			// Act
			const result = Ownable().transferOwnership(ADDRESS_ZERO);
			// Assert
			expect(result).to.revertedWith("Ownable: new owner is the zero address");
			expect(await Ownable().owner()).to.equal(Alice.address);
		});

		it("Fermion.transferOwnership: Should not let non-owner transfer ownership", async () =>
		{
			// Arrange
			// Act
			const result = Ownable().connect(Carol).transferOwnership(Bob.address);
			// Assert
			expect(result).to.revertedWith("Ownable: caller is not the owner");
			expect(await Ownable().owner()).to.equal(Alice.address);
		});
	});

	async function setupTest(lowerEthLimit: number, upperEthLimit: number, conversionRate: number)
	{
		ContractFermion = await FermionFactory.deploy();
		await ContractFermion.deployed();

		ContractFermionReactor = await FermionReactorFactory.deploy(ExpandTo18Decimals(lowerEthLimit), ExpandTo18Decimals(upperEthLimit), ContractFermion.address, conversionRate);
		await ContractFermionReactor.deployed();
	}
});
