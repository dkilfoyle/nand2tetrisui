// This file is part of www.nand2tetris.org
// and the book "The Elements of Computing Systems"
// by Nisan and Schocken, MIT Press.
// File name: projects/01/Or16.tst

output-list a%B b%B out%B;

set a %B0000000000000000,
set b %B0000000000000000,
eval,
output,
expect out %B0000000000000000;

set a %B0000000000000000,
set b %B1111111111111111,
eval,
output,
expect out %B1111111111111111;

set a %B1111111111111111,
set b %B1111111111111111,
eval,
output,
expect out %B1111111111111111;

set a %B1010101010101010,
set b %B0101010101010101,
eval,
output,
expect out %B1111111111111111;

set a %B0011110011000011,
set b %B0000111111110000,
eval,
output,
expect out %B0011111111110011;

set a %B0001001000110100,
set b %B1001100001110110,
eval,
output,
expect out %B1001101001110110;