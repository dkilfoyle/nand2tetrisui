output-list time%S inM%D0.6.0 instruction%B0.16.0 reset%B2.1.2 outM%D1.6.0 writeM%B3.1.3 addressM%D0.5.0 pc%D0.5.0 DRegister%D1.6.1 zr%B1.2.1 ng%B1.2.1 writeM%B2.1.2 loadA%B2.1.2 loadD%B2.1.2 loadPC%B2.1.2 selA%B2.1.2 selY%B2.1.2;

set instruction %B0011000000111001, note "@12345",
tick, output, tock, output;

set instruction %B1110110000010000, note "D=A",
tick, output, tock, output;

set instruction %B0101101110100000, note "@23456",
tick, output, tock, output;

set instruction %B1110000111010000, note "D=A-D",
tick, output, tock, output;

set instruction %B0000001111101000, note "@1000",
tick, output, tock, output;

set instruction %B1110001100001000, note "M=D",
tick, output, tock, output;

set instruction %B0000001111101001, note "@1001",
tick, output, tock, output;

set instruction %B1110001110011000, note "MD=D-1",
tick, output, tock, output;

set instruction %B0000001111101000, note "@1000",
tick, output, tock, output;

set instruction %B1111010011010000, note "D=D-M",
set inM 11111,
tick, output, tock, output;

set instruction %B0000000000001110, note "@14",
tick, output, tock, output;

set instruction %B1110001100000100, note "D;jlt",
tick, output, tock, output;

set instruction %B0000001111100111, note "@999",
tick, output, tock, output;

set instruction %B1110110111100000, note "A=A+1",
tick, output, tock, output;

set instruction %B1110001100001000, note "M=D",
tick, output, tock, output;

set instruction %B0000000000010101, note "@21",
tick, output, tock, output;

set instruction %B1110011111000010, note "D+1;jeq",
tick, output, tock, output;

set instruction %B0000000000000010, note "@2",
tick, output, tock, output;

set instruction %B1110000010010000, note "D=D+A",
tick, output, tock, output;

set instruction %B0000001111101000, note "@1000",
tick, output, tock, output;

set instruction %B1110111010010000, note "D=-1",
tick, output, tock, output;

set instruction %B1110001100000001, note "D;JGT",
tick, output, tock, output;

set instruction %B1110001100000010, note "D;JEQ",
tick, output, tock, output;

set instruction %B1110001100000011, note "D;JGE",
tick, output, tock, output;

set instruction %B1110001100000100, note "D;JLT",
tick, output, tock, output;

set instruction %B1110001100000101, note "D;JNE",
tick, output, tock, output;

set instruction %B1110001100000110, note "D;JLE",
tick, output, tock, output;

set instruction %B1110001100000111, note "D;JMP",
tick, output, tock, output;

set instruction %B1110101010010000, note "D=0",
tick, output, tock, output;

set instruction %B1110001100000001, note "D;JGT",
tick, output, tock, output;

set instruction %B1110001100000010, note "D;JEQ",
tick, output, tock, output;

set instruction %B1110001100000011, note "D;JGE",
tick, output, tock, output;

set instruction %B1110001100000100, note "D;JLT",
tick, output, tock, output;

set instruction %B1110001100000101, note "D;JNE",
tick, output, tock, output;

set instruction %B1110001100000110, note "D;JLE",
tick, output, tock, output;

set instruction %B1110001100000111, note "D;JMP",
tick, output, tock, output;

set instruction %B1110111111010000, note "D=1",
tick, output, tock, output;

set instruction %B1110001100000001, note "D;JGT",
tick, output, tock, output;

set instruction %B1110001100000010, note "D;JEQ",
tick, output, tock, output;

set instruction %B1110001100000011, note "D;JGE",
tick, output, tock, output;

set instruction %B1110001100000100, note "D;JLT",
tick, output, tock, output;

set instruction %B1110001100000101, note "D;JNE",
tick, output, tock, output;

set instruction %B1110001100000110, note "D;JLE",
tick, output, tock, output;

set instruction %B1110001100000111, note "D;JMP",
tick, output, tock, output;

set reset 1;
tick, output, tock, output;

set instruction %B0111111111111111, note "@32767",
set reset 0;
tick, output, tock, output;
