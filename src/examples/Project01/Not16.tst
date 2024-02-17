// This file is part of www.nand2tetris.org
// and the book "The Elements of Computing Systems"
// by Nisan and Schocken, MIT Press.
// File name: projects/01/Not16.tst

// load Not16.hdl,
// output-file Not16.out,
// compare-to Not16.cmp,
// output-list in%B1.16.1 out%B1.16.1;

set in %B0000000000000000,
eval,
output,
expect out %B1111111111111111;

set in %B1111111111111111,
eval,
output,
expect out %B0000000000000000;

set in %B1010101010101010,
eval,
output,
expect out %B0101010101010101;

set in %B0011110011000011,
eval,
output,
expect out %B1100001100111100;

set in %B0001001000110100,
eval,
output,
expect out %B1110110111001011;