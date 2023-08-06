import { BigNumber } from "ethers";

export const BASE_TEN = 10;
export const ADDRESS_ZERO = "0x0000000000000000000000000000000000000000";
export const MAX_UINT256 = BigNumber.from(2).pow(256).sub(1);
export const enum PANIC_CODES {
	ArithmeticOverflowUnderflow = 0x11,
	ArrayOutOfBounds = 0x32
}

export * from "./mine";
export * from "./time";
export * from "./utilities";
export * from "./chai/emitOnly";
