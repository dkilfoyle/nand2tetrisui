output-list instruction%B0.16.0 zr%B2.1.2 ng%B2.1.2 writeM%B2.1.2 loadA%B2.1.2 loadD%B2.1.2 loadPC%B2.1.2 selA%B2.1.2 selY%B2.1.2;


set instruction %B0011000000111001, note "@12345",
eval, output;

set instruction %B1110110000010000, note "D=A",
eval, output;

set instruction %B0101101110100000, note "@23456",
eval, output;

set instruction %B1110000111010000, note "D=A-D",
eval, output;

set instruction %B0000001111101000, note "@1000",
eval, output;

set instruction %B1110001100001000, note "M=D",
eval, output;

set instruction %B0000001111101001, note "@1001",
eval, output;

set instruction %B1110001110011000, note "MD=D-1",
eval, output;

set instruction %B0000001111101000, note "@1000",
eval, output;

set instruction %B1111010011010000, note "D=D-M",
eval, output;

set instruction %B0000000000001110, note "@14",
eval, output;

set instruction %B1110001100000100, note "D;jlt",
eval, output;

set instruction %B0000001111100111, note "@999",
eval, output;

set instruction %B1110110111100000, note "A=A+1",
eval, output;

set instruction %B1110001100001000, note "M=D",
eval, output;

set instruction %B0000000000010101, note "@21",
eval, output;

set instruction %B1110011111000010, note "D+1;jeq",
eval, output;

set instruction %B0000000000000010, note "@2",
eval, output;

set instruction %B1110000010010000, note "D=D+A",
eval, output;

set instruction %B0000001111101000, note "@1000",
eval, output;

set instruction %B1110111010010000, note "D=-1",
set ng 1, set zr 0,
eval, output;

set instruction %B1110001100000001, note "D;JGT",
eval, output;

set instruction %B1110001100000010, note "D;JEQ",
eval, output;

set instruction %B1110001100000011, note "D;JGE",
eval, output;

set instruction %B1110001100000100, note "D;JLT",
eval, output;

set instruction %B1110001100000101, note "D;JNE",
eval, output;

set instruction %B1110001100000110, note "D;JLE",
eval, output;

set instruction %B1110001100000111, note "D;JMP",
eval, output;

set instruction %B1110101010010000, note "D=0",
set zr 1, set ng 0,
eval, output;

set instruction %B1110001100000001, note "D;JGT",
eval, output;

set instruction %B1110001100000010, note "D;JEQ",
eval, output;

set instruction %B1110001100000011, note "D;JGE",
eval, output;

set instruction %B1110001100000100, note "D;JLT",
eval, output;

set instruction %B1110001100000101, note "D;JNE",
eval, output;

set instruction %B1110001100000110, note "D;JLE",
eval, output;

set instruction %B1110001100000111, note "D;JMP",
eval, output;

set instruction %B1110111111010000, note "D=1",
set zr 0, set ng 0,
eval, output;

set instruction %B1110001100000001, note "D;JGT",
eval, output;

set instruction %B1110001100000010, note "D;JEQ",
eval, output;

set instruction %B1110001100000011, note "D;JGE",
eval, output;

set instruction %B1110001100000100, note "D;JLT",
eval, output;

set instruction %B1110001100000101, note "D;JNE",
eval, output;

set instruction %B1110001100000110, note "D;JLE",
eval, output;

set instruction %B1110001100000111, note "D;JMP",
eval, output;
