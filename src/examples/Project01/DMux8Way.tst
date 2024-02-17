// This file is part of www.nand2tetris.org
// and the book "The Elements of Computing Systems"
// by Nisan and Schocken, MIT Press.
// File name: projects/01/DMux4Way.tst

// load DMux4Way.hdl,
// output-file DMux4Way.out,
// compare-to DMux4Way.cmp,
// output-list in%B2.1.2 sel%B2.2.2 a%B2.1.2 b%B2.1.2 c%B2.1.2 d%B2.1.2;

set in 1,
set sel %B00,
eval,
output,
expect a 1,
expect b 0,
expect c 0,
expect d 0,
expect e 0,
expect f 0,
expect g 0,
expect h 0;

set sel %B01,
eval,
output,
expect a 0,
expect b 1,
expect c 0,
expect d 0,
expect e 0,
expect f 0,
expect g 0,
expect h 0;

set sel %B10,
eval,
output,
expect a 0,
expect b 0,
expect c 1,
expect d 0,
expect e 0,
expect f 0,
expect g 0,
expect h 0;

set sel %B11,
eval,
output,
expect a 0,
expect b 0,
expect c 0,
expect d 1,
expect e 0,
expect f 0,
expect g 0,
expect h 0;

set sel %B100,
eval,
output,
expect a 0,
expect b 0,
expect c 0,
expect d 0,
expect e 1,
expect f 0,
expect g 0,
expect h 0;

set sel %B101,
eval,
output,
expect a 0,
expect b 0,
expect c 0,
expect d 0,
expect e 0,
expect f 1,
expect g 0,
expect h 0;

set sel %B110,
eval,
output,
expect a 0,
expect b 0,
expect c 0,
expect d 0,
expect e 0,
expect f 0,
expect g 1,
expect h 0;

set sel %B111,
eval,
output,
expect a 0,
expect b 0,
expect c 0,
expect d 0,
expect e 0,
expect f 0,
expect g 0,
expect h 1;