// This file is part of www.nand2tetris.org
// and the book "The Elements of Computing Systems"
// by Nisan and Schocken, MIT Press.
// File name: projects/02/Add16.tst

// load Add16.hdl,
// output-file Add16.out,
// compare-to Add16.cmp,
output-list a%B1.16.1 b%B1.16.1 out%B1.16.1;

set a %B0000000000000000,
set b %B0000000000000000,
eval,
output,
expect out %B0000000000000000,
note "0+0=0";

set a %B0000000000000000,
set b %B1111111111111111,
eval,
output,
expect out %B1111111111111111,
note "0+-1=-1";

// from left 1+1 = [1]0,
// 1+1+c = [1]1
// 1+1+c = [1]1....
// 2s complement = invert then add 1
// 2      = 0000000000000010
// invert = 1111111111111101
// + 1      0000000000000001
// -2     = 1111111111111110
set a %B1111111111111111,
set b %B1111111111111111,
eval,
output,
expect out %B1111111111111110,
note "-1+-1=-2";

set a %B1010101010101010,
set b %B0101010101010101,
eval,
output,
expect out %B1111111111111111;

set a %B0011110011000011,
set b %B0000111111110000,
eval,
output,
expect out %B0100110010110011;

set a %B0001001000110100,
set b %B1001100001110110,
eval,
output,
expect out %B1010101010101010;
