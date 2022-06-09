export const BASE_TEN = 10;
export const ADDRESS_ZERO = "0x0000000000000000000000000000000000000000";
export const enum PANIC_CODES {
	Code_0x11 = "reverted with panic code 0x11 (Arithmetic operation underflowed or overflowed outside of an unchecked block)",
	Code_0x32 = "reverted with panic code 0x32 (Array accessed at an out-of-bounds or negative index)"
}

export * from "./mine";
export * from "./time";
export * from "./chai/emitOnly";
